import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, resolveImageUrl } from "@/constants";
import { Dispute, DisputeStatus } from "@/types";
import { useMyDisputes, useAddDisputeEvidence } from "@/hooks/use-disputes";
import { useUploadImage } from "@/hooks/use-listings";
import { useAuthStore } from "@/store/auth.store";
import { useT } from "@/i18n/useT";

const STATUS_VISUAL: Record<
  DisputeStatus,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  OPEN: { color: COLORS.warning, bg: "#fff7ed", icon: "time-outline" },
  RESOLVED_FOR_RENTER: { color: COLORS.success, bg: "#ecfdf5", icon: "checkmark-circle-outline" },
  RESOLVED_FOR_OWNER: { color: COLORS.success, bg: "#ecfdf5", icon: "checkmark-circle-outline" },
  RESOLVED_SPLIT: { color: COLORS.success, bg: "#ecfdf5", icon: "checkmark-circle-outline" },
  REJECTED: { color: COLORS.muted, bg: "#f3f4f6", icon: "close-circle-outline" },
};

export default function MyDisputesScreen() {
  const t = useT();
  const STATUS_LABELS: Record<DisputeStatus, string> = {
    OPEN: t("Dispute.statusOpen"),
    RESOLVED_FOR_RENTER: t("Dispute.statusForRenter"),
    RESOLVED_FOR_OWNER: t("Dispute.statusForOwner"),
    RESOLVED_SPLIT: t("Dispute.statusSplit"),
    REJECTED: t("Dispute.statusRejected"),
  };
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 4, padding: 4 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const { data, isLoading } = useMyDisputes();
  const { user: me } = useAuthStore();
  const { mutate: addEvidence, isPending: isAdding } = useAddDisputeEvidence();
  const { mutateAsync: uploadImage } = useUploadImage();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleAdd = (dispute: Dispute) => {
    const pick = async (source: "gallery" | "camera") => {
      let result: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") {
          Toast.show({ type: "error", text1: t("Dispute.noCameraAccess") });
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsMultipleSelection: true,
          selectionLimit: 5,
        });
      }
      if (result.canceled || !result.assets?.length) return;
      setUploadingId(dispute.id);
      try {
        const urls = await Promise.all(
          result.assets.map((a) => uploadImage(a.uri)),
        );
        addEvidence({ id: dispute.id, images: urls });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : t("Dispute.uploadError");
        Toast.show({ type: "error", text1: msg });
      } finally {
        setUploadingId(null);
      }
    };

    if (Platform.OS === "web") {
      void pick("gallery");
      return;
    }
    Alert.alert(t("Dispute.evidenceTitle"), t("Dispute.evidenceFrom"), [
      { text: t("Dispute.gallery"), onPress: () => void pick("gallery") },
      { text: t("Dispute.camera"), onPress: () => void pick("camera") },
      { text: t("Common.cancel"), style: "cancel" },
    ]);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={data ?? []}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: d }) => {
          const r = d.rentalRequest!;
          const iAmRenter = r.renter_id === me?.id;
          const myEvidence = iAmRenter ? d.renter_evidence : d.owner_evidence;
          const theirEvidence = iAmRenter ? d.owner_evidence : d.renter_evidence;
          const meta = STATUS_VISUAL[d.status];
          const statusLabel = STATUS_LABELS[d.status];
          const deposit = Number(r.listing.deposit);
          const refund = d.deposit_to_renter == null ? null : Number(d.deposit_to_renter);

          return (
            <View style={styles.card}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.headerLeft}
                  onPress={() => router.push(`/listings/${r.listing.id}` as never)}
                >
                  {r.listing.images?.[0] ? (
                    <Image
                      source={{
                        uri: resolveImageUrl(r.listing.images[0].image_url) ?? "",
                      }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Ionicons name="image-outline" size={20} color={COLORS.border} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {r.listing.title}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={2}>
                      {d.reason}
                    </Text>
                    <Text style={styles.meta}>
                      {t("Dispute.depositLine", { date: new Date(d.created_at).toLocaleDateString(), amount: deposit.toLocaleString() })}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={12} color={meta.color} />
                  <Text style={[styles.badgeText, { color: meta.color }]}>
                    {statusLabel}
                  </Text>
                </View>
              </View>

              {d.description ? (
                <View style={styles.descBox}>
                  <Text style={styles.descText}>{d.description}</Text>
                </View>
              ) : null}

              <View style={styles.evidenceRow}>
                <View style={styles.evidenceCol}>
                  <Text style={styles.evidenceLabel}>
                    {t("Dispute.yourPhotos", { count: myEvidence.length })}
                  </Text>
                  <EvidenceGallery urls={myEvidence} onPick={setLightbox} />
                  {d.status === "OPEN" && (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAdd(d)}
                      disabled={
                        isAdding || uploadingId === d.id || myEvidence.length >= 10
                      }
                    >
                      <Ionicons
                        name={
                          uploadingId === d.id ? "hourglass-outline" : "add-circle-outline"
                        }
                        size={14}
                        color={COLORS.primary}
                      />
                      <Text style={styles.addBtnText}>
                        {uploadingId === d.id ? t("Dispute.uploadingDots") : t("Dispute.addBtn")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.evidenceCol}>
                  <Text style={styles.evidenceLabel}>
                    {iAmRenter
                      ? t("Dispute.theirOwnerPhotos", { count: theirEvidence.length })
                      : t("Dispute.theirRenterPhotos", { count: theirEvidence.length })}
                  </Text>
                  <EvidenceGallery urls={theirEvidence} onPick={setLightbox} />
                </View>
              </View>

              {d.status !== "OPEN" && (
                <View style={styles.resolutionBox}>
                  <Text style={styles.resolutionTitle}>{t("Dispute.adminDecision")}</Text>
                  {refund !== null && (
                    <Text style={styles.resolutionText}>
                      {t("Dispute.decisionSplit", { renter: refund.toLocaleString(), owner: (deposit - refund).toLocaleString() })}
                    </Text>
                  )}
                  {d.admin_note ? (
                    <Text style={styles.resolutionNote}>{d.admin_note}</Text>
                  ) : null}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>{t("Dispute.empty")}</Text>
          </View>
        }
      />

      <Modal
        visible={!!lightbox}
        transparent
        animationType="fade"
        onRequestClose={() => setLightbox(null)}
      >
        <TouchableOpacity
          style={styles.lightboxOverlay}
          activeOpacity={1}
          onPress={() => setLightbox(null)}
        >
          {lightbox && (
            <Image
              source={{ uri: resolveImageUrl(lightbox) ?? lightbox }}
              style={styles.lightboxImg}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function EvidenceGallery({
  urls,
  onPick,
}: {
  urls: string[];
  onPick: (u: string) => void;
}) {
  const t = useT();
  if (!urls.length) {
    return <Text style={styles.emptyEvidence}>{t("Dispute.noPhotos")}</Text>;
  }
  return (
    <View style={styles.thumbRow}>
      {urls.map((url, i) => (
        <TouchableOpacity key={i} onPress={() => onPick(url)}>
          <Image
            source={{ uri: resolveImageUrl(url) ?? url }}
            style={styles.evidenceThumb}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  headerLeft: { flexDirection: "row", gap: 10, flex: 1 },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbPlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  meta: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  descBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
  },
  descText: { fontSize: 13, color: COLORS.text },
  evidenceRow: { flexDirection: "row", gap: 10 },
  evidenceCol: { flex: 1, gap: 6 },
  evidenceLabel: { fontSize: 11, fontWeight: "600", color: COLORS.muted },
  emptyEvidence: { fontSize: 12, color: COLORS.muted, fontStyle: "italic" },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  evidenceThumb: { width: 52, height: 52, borderRadius: 6 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 12 },
  resolutionBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: 4,
  },
  resolutionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  resolutionText: { fontSize: 12, color: COLORS.text },
  resolutionNote: { fontSize: 12, color: COLORS.muted },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.muted },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImg: { width: "100%", height: "100%" },
});
