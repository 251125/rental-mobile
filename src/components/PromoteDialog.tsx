import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import {
  PromotionPlan,
  PromotionTier,
  usePromotionTiers,
  usePromoteListing,
} from "@/hooks/use-wallet";
import { useT } from "@/i18n/useT";

interface Props {
  visible: boolean;
  listingId: string;
  listingTitle: string;
  onClose: () => void;
}

const TIER_ICON: Record<PromotionTier, keyof typeof Ionicons.glyphMap> = {
  basic: "rocket-outline",
  pro: "sparkles-outline",
  premium: "diamond-outline",
};

const TIER_COLOR: Record<PromotionTier, string> = {
  basic: "#f59e0b",
  pro: "#ea580c",
  premium: "#8b5cf6",
};

export default function PromoteDialog({
  visible,
  listingId,
  listingTitle,
  onClose,
}: Props) {
  const t = useT();
  const { data: tiers = [], isLoading } = usePromotionTiers();
  const { mutate: promote, isPending } = usePromoteListing();
  const [selected, setSelected] = useState<PromotionTier>("basic");

  const PERKS_BY_TIER: Record<PromotionTier, string[]> = {
    basic: [t("Listing.promoteBasic1"), t("Listing.promoteBasic2")],
    pro: [t("Listing.promoteBasic1"), t("Listing.promoteBasic2"), t("Listing.promotePro1")],
    premium: [
      t("Listing.promoteBasic1"),
      t("Listing.promoteBasic2"),
      t("Listing.promotePro1"),
      t("Listing.promotePremium1"),
    ],
  };

  const handlePromote = () => {
    promote(
      { listingId, tier: selected },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t("Listing.promoteTitle")}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            «{listingTitle}»
          </Text>

          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 32 }} />
          ) : (
            <ScrollView style={{ maxHeight: 420 }}>
              {tiers.map((plan) => (
                <TierCard
                  key={plan.key}
                  plan={plan}
                  selected={selected === plan.key}
                  perks={PERKS_BY_TIER[plan.key]}
                  label={t(`Listing.promoteTier_${plan.key}` as `Listing.promoteTier_basic`)}
                  daysLabel={t("Listing.promoteDays", { days: plan.days })}
                  onSelect={() => setSelected(plan.key)}
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isPending}
            >
              <Text style={styles.cancelText}>{t("Listing.promoteCancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, (isPending || isLoading) && { opacity: 0.6 }]}
              onPress={handlePromote}
              disabled={isPending || isLoading}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>{t("Listing.promoteConfirm")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TierCard({
  plan,
  selected,
  perks,
  label,
  daysLabel,
  onSelect,
}: {
  plan: PromotionPlan;
  selected: boolean;
  perks: string[];
  label: string;
  daysLabel: string;
  onSelect: () => void;
}) {
  const accent = TIER_COLOR[plan.key];
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && {
          borderColor: accent,
          backgroundColor: accent + "10",
        },
      ]}
      onPress={onSelect}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={TIER_ICON[plan.key]} size={22} color={accent} />
        {selected && (
          <View style={[styles.checkDot, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.tierLabel}>{label}</Text>
      <Text style={styles.priceText}>{plan.price.toLocaleString()} ₸</Text>
      <Text style={styles.daysText}>{daysLabel}</Text>
      {perks.map((p) => (
        <View key={p} style={styles.perkRow}>
          <Ionicons name="checkmark" size={12} color={COLORS.success} />
          <Text style={styles.perkText}>{p}</Text>
        </View>
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
    maxHeight: "92%",
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.muted, marginBottom: 12 },
  card: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  tierLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  priceText: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginTop: 2 },
  daysText: { fontSize: 12, color: COLORS.muted, marginBottom: 10 },
  perkRow: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginVertical: 2 },
  perkText: { fontSize: 12, color: COLORS.text, flex: 1, lineHeight: 16 },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelText: { color: COLORS.muted, fontWeight: "600" },
  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "700" },
});
