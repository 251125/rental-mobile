import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, resolveImageUrl } from "@/constants";
import { Dispute, DisputeStatus } from "@/types";
import { useAdminDisputes, useResolveDispute } from "@/hooks/use-disputes";
import { useAuthStore } from "@/store/auth.store";

const STATUS_META: Record<
  DisputeStatus,
  { label: string; color: string; bg: string }
> = {
  OPEN: { label: "Открыт", color: COLORS.warning, bg: "#fff7ed" },
  RESOLVED_FOR_RENTER: { label: "Арендатору", color: COLORS.success, bg: "#ecfdf5" },
  RESOLVED_FOR_OWNER: { label: "Владельцу", color: COLORS.success, bg: "#ecfdf5" },
  RESOLVED_SPLIT: { label: "Разделён", color: COLORS.success, bg: "#ecfdf5" },
  REJECTED: { label: "Отклонён", color: COLORS.muted, bg: "#f3f4f6" },
};

const OUTCOMES: { value: DisputeStatus; label: string }[] = [
  { value: "RESOLVED_FOR_RENTER", label: "Вернуть залог арендатору" },
  { value: "RESOLVED_FOR_OWNER", label: "Залог остаётся владельцу" },
  { value: "RESOLVED_SPLIT", label: "Разделить" },
  { value: "REJECTED", label: "Отклонить спор" },
];

function Gallery({
  urls,
  onPick,
}: {
  urls: string[];
  onPick: (u: string) => void;
}) {
  if (!urls.length) {
    return <Text style={styles.empty}>Нет фото</Text>;
  }
  return (
    <View style={styles.galleryRow}>
      {urls.map((url, i) => (
        <TouchableOpacity key={i} onPress={() => onPick(url)}>
          <Image
            source={{ uri: resolveImageUrl(url) ?? url }}
            style={styles.thumb}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ResolveForm({ dispute }: { dispute: Dispute }) {
  const deposit = Number(dispute.rentalRequest?.listing?.deposit ?? 0);
  const [outcome, setOutcome] = useState<DisputeStatus>("RESOLVED_FOR_RENTER");
  const [splitText, setSplitText] = useState(String(Math.round(deposit / 2)));
  const [note, setNote] = useState("");
  const { mutate: resolve, isPending } = useResolveDispute();

  const handle = () => {
    let split: number | undefined;
    if (outcome === "RESOLVED_SPLIT") {
      const n = Number(splitText);
      if (Number.isNaN(n) || n < 0 || n > deposit) {
        Toast.show({ type: "error", text1: `Сумма от 0 до ${deposit}` });
        return;
      }
      split = n;
    }
    resolve({
      id: dispute.id,
      status: outcome,
      deposit_to_renter: split,
      admin_note: note.trim() || undefined,
    });
  };

  return (
    <View style={styles.resolveBox}>
      <Text style={styles.resolveTitle}>Решение</Text>
      <View style={styles.outcomeGrid}>
        {OUTCOMES.map((o) => (
          <TouchableOpacity
            key={o.value}
            onPress={() => setOutcome(o.value)}
            style={[
              styles.outcomeBtn,
              outcome === o.value && styles.outcomeBtnActive,
            ]}
          >
            <Text
              style={[
                styles.outcomeText,
                outcome === o.value && styles.outcomeTextActive,
              ]}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {outcome === "RESOLVED_SPLIT" && (
        <View style={styles.splitBox}>
          <Text style={styles.label}>
            Возврат арендатору, ₸ (макс {deposit.toLocaleString()})
          </Text>
          <TextInput
            keyboardType="numeric"
            value={splitText}
            onChangeText={setSplitText}
            style={styles.input}
          />
          <Text style={styles.muted}>
            Владельцу: {(deposit - Number(splitText || 0)).toLocaleString()} ₸
          </Text>
        </View>
      )}
      <Text style={styles.label}>Заметка (необязательно)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
        maxLength={1000}
        textAlignVertical="top"
        style={[styles.input, { minHeight: 70 }]}
        placeholder="Обоснование решения"
        placeholderTextColor={COLORS.muted}
      />
      <TouchableOpacity
        style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
        disabled={isPending}
        onPress={handle}
      >
        <Text style={styles.submitText}>
          {isPending ? "Применение..." : "Применить решение"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminDisputesScreen() {
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

  const { user } = useAuthStore();
  const [tab, setTab] = useState<"open" | "all">("open");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { data, isLoading } = useAdminDisputes(tab === "open" ? "OPEN" : "ALL");

  if (!user || user.role !== "ADMIN") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.border} />
          <Text style={styles.deniedText}>Доступ запрещён</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.tabs}>
        {(["open", "all"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === t && styles.tabTextActive]}
            >
              {t === "open" ? "Открытые" : "Все"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name="shield-checkmark-outline"
                size={48}
                color={COLORS.border}
              />
              <Text style={styles.emptyText}>Споров нет</Text>
            </View>
          }
          renderItem={({ item: d }) => {
            const r = d.rentalRequest!;
            const meta = STATUS_META[d.status];
            const deposit = Number(r.listing.deposit);
            const refund = d.deposit_to_renter == null ? null : Number(d.deposit_to_renter);

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/listings/${r.listing.id}` as never)}
                  >
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {r.listing.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      Открыл:{" "}
                      <Text style={styles.linkText}>{d.openedBy?.name}</Text>{" "}
                      • Залог: {deposit.toLocaleString()} ₸
                    </Text>
                    <Text style={styles.cardMeta}>
                      Арендатор:{" "}
                      <Text style={styles.linkText}>{r.renter?.name}</Text>{" "}
                      • {new Date(d.created_at).toLocaleString("ru-RU")}
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.badgeText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>{d.reason}</Text>
                  {d.description ? (
                    <Text style={styles.descText}>{d.description}</Text>
                  ) : null}
                </View>

                <View style={styles.evidenceCol}>
                  <Text style={styles.evidenceLabel}>
                    Доказательства арендатора ({d.renter_evidence.length})
                  </Text>
                  <Gallery urls={d.renter_evidence} onPick={setLightbox} />
                </View>
                <View style={styles.evidenceCol}>
                  <Text style={styles.evidenceLabel}>
                    Доказательства владельца ({d.owner_evidence.length})
                  </Text>
                  <Gallery urls={d.owner_evidence} onPick={setLightbox} />
                </View>
                {r.return_images?.length > 0 && (
                  <View style={styles.evidenceCol}>
                    <Text style={styles.evidenceLabel}>
                      Фото возврата ({r.return_images.length})
                    </Text>
                    <Gallery urls={r.return_images} onPick={setLightbox} />
                  </View>
                )}

                {d.status === "OPEN" ? (
                  <ResolveForm dispute={d} />
                ) : (
                  <View style={styles.resolutionView}>
                    {refund !== null && (
                      <Text style={styles.resolutionText}>
                        Арендатору: {refund.toLocaleString()} ₸ • Владельцу:{" "}
                        {(deposit - refund).toLocaleString()} ₸
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
        />
      )}

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.muted, fontWeight: "500" },
  tabTextActive: { color: COLORS.primary, fontWeight: "700" },
  list: { padding: 14 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  cardMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  linkText: { color: COLORS.primary, fontWeight: "600" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  reasonBox: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  reasonText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  descText: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  evidenceCol: { gap: 4 },
  evidenceLabel: { fontSize: 12, fontWeight: "600", color: COLORS.muted },
  empty: { fontSize: 12, color: COLORS.muted, fontStyle: "italic" },
  galleryRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  thumb: { width: 60, height: 60, borderRadius: 6 },
  resolveBox: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  resolveTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  outcomeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  outcomeBtn: {
    flexBasis: "48%",
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  outcomeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  outcomeText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  outcomeTextActive: { color: COLORS.white },
  splitBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  muted: { fontSize: 11, color: COLORS.muted },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  submitText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  resolutionView: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  resolutionText: { fontSize: 12, color: COLORS.text },
  resolutionNote: { fontSize: 12, color: COLORS.muted },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.muted },
  denied: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  deniedText: { fontSize: 16, color: COLORS.muted },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImg: { width: "100%", height: "100%" },
});
