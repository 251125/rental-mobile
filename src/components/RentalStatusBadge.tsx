import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RentalRequestStatus } from "@/types";
import { COLORS } from "@/constants";

const STATUS_CONFIG: Record<
  RentalRequestStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: "Ожидает", color: COLORS.warning, bg: "#fef3c7" },
  APPROVED: { label: "Одобрено", color: COLORS.success, bg: "#dcfce7" },
  REJECTED: { label: "Отклонено", color: COLORS.danger, bg: "#fee2e2" },
  CANCELLED: { label: "Отменено", color: COLORS.muted, bg: "#f3f4f6" },
  COMPLETED: { label: "Завершено", color: COLORS.primary, bg: COLORS.primaryLight },
};

export default function RentalStatusBadge({
  status,
}: {
  status: RentalRequestStatus;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
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
