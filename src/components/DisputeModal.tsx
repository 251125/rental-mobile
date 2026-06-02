import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { COLORS, resolveImageUrl } from "@/constants";
import { RentalRequest } from "@/types";
import { useOpenDispute } from "@/hooks/use-disputes";
import { useUploadImage } from "@/hooks/use-listings";
import { useT } from "@/i18n/useT";

interface Props {
  rental: RentalRequest;
  visible: boolean;
  onClose: () => void;
}

export default function DisputeModal({ rental, visible, onClose }: Props) {
  const t = useT();
  const PRESETS = [
    t("Dispute.preset1"),
    t("Dispute.preset2"),
    t("Dispute.preset3"),
    t("Dispute.preset4"),
    t("Dispute.preset5"),
  ];
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { mutate: openDispute, isPending } = useOpenDispute();
  const { mutateAsync: uploadImage } = useUploadImage();

  const reset = () => {
    setReason("");
    setDescription("");
    setEvidence([]);
  };

  const pickImage = (source: "gallery" | "camera") => {
    void (async () => {
      if (evidence.length >= 6) {
        Toast.show({ type: "info", text1: t("Dispute.maxPhotos") });
        return;
      }
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
          selectionLimit: 6 - evidence.length,
        });
      }
      if (result.canceled || !result.assets?.length) return;
      setUploading(true);
      try {
        const urls = await Promise.all(
          result.assets.map((a) => uploadImage(a.uri)),
        );
        setEvidence((prev) => [...prev, ...urls].slice(0, 6));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : t("Dispute.uploadError");
        Toast.show({ type: "error", text1: msg });
      } finally {
        setUploading(false);
      }
    })();
  };

  const handleAttach = () => {
    if (Platform.OS === "web") {
      pickImage("gallery");
      return;
    }
    Alert.alert(t("Dispute.photoSourceTitle"), t("Dispute.photoSourceMsg"), [
      { text: t("Dispute.gallery"), onPress: () => pickImage("gallery") },
      { text: t("Dispute.camera"), onPress: () => pickImage("camera") },
      { text: t("Common.cancel"), style: "cancel" },
    ]);
  };

  const handleSubmit = () => {
    if (reason.trim().length < 3) {
      Toast.show({ type: "error", text1: t("Dispute.reasonRequired") });
      return;
    }
    openDispute(
      {
        rental_request_id: rental.id,
        reason: reason.trim(),
        description: description.trim() || undefined,
        evidence: evidence.length ? evidence : undefined,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    if (isPending) return;
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="warning-outline" size={22} color={COLORS.warning} />
            <Text style={styles.title}>{t("Dispute.openTitle")}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ maxHeight: "85%" }}
            contentContainerStyle={{ gap: 14, paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.subtitle} numberOfLines={2}>
              «{rental.listing.title}». Опишите проблему — администратор рассмотрит и
              решит, как разделить залог.
            </Text>

            <View>
              <Text style={styles.label}>{t("Dispute.reason")}</Text>
              <View style={styles.presetRow}>
                {PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setReason(p)}
                    style={[
                      styles.preset,
                      reason === p && styles.presetActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        reason === p && styles.presetTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={reason}
                maxLength={255}
                onChangeText={setReason}
                placeholder={t("Dispute.reasonPlaceholder")}
                placeholderTextColor={COLORS.muted}
              />
            </View>

            <View>
              <Text style={styles.label}>{t("Dispute.detailsLabel")}</Text>
              <TextInput
                style={[styles.input, { height: 90 }]}
                value={description}
                onChangeText={setDescription}
                maxLength={2000}
                multiline
                textAlignVertical="top"
                placeholder={t("Dispute.detailsPlaceholder")}
                placeholderTextColor={COLORS.muted}
              />
            </View>

            <View>
              <Text style={styles.label}>{t("Dispute.evidenceLabel")}</Text>
              {evidence.length > 0 && (
                <View style={styles.thumbRow}>
                  {evidence.map((url, i) => (
                    <View key={i} style={styles.thumbWrap}>
                      <Image
                        source={{ uri: resolveImageUrl(url) ?? url }}
                        style={styles.thumb}
                      />
                      <TouchableOpacity
                        style={styles.thumbRemove}
                        onPress={() =>
                          setEvidence((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handleAttach}
                disabled={uploading || evidence.length >= 6}
              >
                <Ionicons
                  name={uploading ? "hourglass-outline" : "camera-outline"}
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.attachText}>
                  {uploading ? t("Dispute.uploadingDots") : t("Dispute.addPhoto")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={isPending}
            >
              <Text style={styles.cancelText}>{t("Common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isPending || uploading}
            >
              <Text style={styles.submitText}>
                {isPending ? t("Dispute.sendingShort") : t("Dispute.submit")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: "95%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text, flex: 1 },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  preset: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  presetActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  presetText: { fontSize: 12, color: COLORS.text },
  presetTextActive: { color: COLORS.white },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  thumbWrap: { position: "relative" },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  thumbRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  attachText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelText: { color: COLORS.muted, fontWeight: "600" },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.warning,
    alignItems: "center",
  },
  submitText: { color: COLORS.white, fontWeight: "700" },
});
