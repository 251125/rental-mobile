import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { confirm } from "@/lib/confirm";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import {
  BlockedDate,
  useBlockDates,
  useUnblockDates,
} from "@/hooks/use-listings";
import { useT } from "@/i18n/useT";
import Toast from "react-native-toast-message";

interface Props {
  listingId: string;
  blocked: BlockedDate[];
}

// YYYY-MM-DD validator
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function BlockDatesManager({ listingId, blocked }: Props) {
  const t = useT();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const { mutate: block, isPending } = useBlockDates(listingId);
  const { mutate: unblock } = useUnblockDates(listingId);

  const submit = () => {
    if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
      Toast.show({ type: "error", text1: t("Listing.blockPickRange") });
      return;
    }
    if (end < start) {
      Toast.show({ type: "error", text1: t("Listing.blockPickRange") });
      return;
    }
    block(
      { start_date: start, end_date: end, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setStart("");
          setEnd("");
          setReason("");
          Toast.show({ type: "success", text1: t("Listing.blockOk") });
        },
        onError: (e: Error) =>
          Toast.show({ type: "error", text1: e.message ?? t("Listing.blockError") }),
      },
    );
  };

  const confirmUnblock = (id: string) => {
    confirm({
      title: t("Listing.blockTitle"),
      message: t("Listing.blockedListTitle"),
      cancelText: t("Common.cancel"),
      confirmText: t("Common.delete"),
      destructive: true,
      onConfirm: () => unblock(id),
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.text} />
        <Text style={styles.title}>{t("Listing.blockTitle")}</Text>
      </View>
      <Text style={styles.hint}>{t("Listing.blockHint")}</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t("Rental.dateStart")}</Text>
          <TextInput
            value={start}
            onChangeText={setStart}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t("Rental.dateEnd")}</Text>
          <TextInput
            value={end}
            onChangeText={setEnd}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>
      </View>

      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder={t("Listing.blockReasonPlaceholder")}
        placeholderTextColor={COLORS.muted}
        style={styles.input}
        maxLength={255}
      />

      <TouchableOpacity
        style={[styles.submitBtn, isPending && { opacity: 0.6 }]}
        disabled={isPending}
        onPress={submit}
      >
        {isPending ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={styles.submitText}>{t("Listing.blockBtn")}</Text>
        )}
      </TouchableOpacity>

      {blocked.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.listTitle}>{t("Listing.blockedListTitle")}</Text>
          {blocked.map((b) => (
            <View key={b.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDates}>
                  {new Date(b.start_date).toLocaleDateString()} —{" "}
                  {new Date(b.end_date).toLocaleDateString()}
                </Text>
                {b.reason ? <Text style={styles.itemReason}>{b.reason}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => confirmUnblock(b.id)}>
                <Ionicons name="close-circle" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginVertical: 8,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  hint: { fontSize: 12, color: COLORS.muted, lineHeight: 16 },
  row: { flexDirection: "row" },
  label: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  list: { marginTop: 8, gap: 8 },
  listTitle: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  itemDates: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  itemReason: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});
