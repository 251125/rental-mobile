import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RentalRequestStatus } from "@/types";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";

const STATUS_VISUAL: Record<RentalRequestStatus, { color: string; bg: string }> = {
  PENDING: { color: COLORS.warning, bg: "#fef3c7" },
  APPROVED: { color: COLORS.success, bg: "#dcfce7" },
  REJECTED: { color: COLORS.danger, bg: "#fee2e2" },
  CANCELLED: { color: COLORS.muted, bg: "#f3f4f6" },
  COMPLETED: { color: COLORS.primary, bg: COLORS.primaryLight },
};

export default function RentalStatusBadge({
  status,
}: {
  status: RentalRequestStatus;
}) {
  const t = useT();
  const labels: Record<RentalRequestStatus, string> = {
    PENDING: t("Rental.statusPending"),
    APPROVED: t("Rental.statusApproved"),
    REJECTED: t("Rental.statusRejected"),
    CANCELLED: t("Rental.statusCancelled"),
    COMPLETED: t("Rental.statusCompleted"),
  };
  const visual = STATUS_VISUAL[status];
  return (
    <View style={[styles.badge, { backgroundColor: visual.bg }]}>
      <Text style={[styles.text, { color: visual.color }]}>{labels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
