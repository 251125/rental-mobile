import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIncomingRentals, useUpdateRentalStatus } from "@/hooks/use-rentals";
import RentalStatusBadge from "@/components/RentalStatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, API_URL } from "@/constants";

export default function IncomingRentalsScreen() {
  const { data: rentals, isLoading } = useIncomingRentals();
  const { mutate: updateStatus, isPending } = useUpdateRentalStatus();

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={rentals ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const img = item.listing.images[0];
          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.listingRow}
                onPress={() => router.push(`/listings/${item.listing_id}`)}
              >
                {img ? (
                  <Image
                    source={{ uri: `${API_URL}${img.image_url}` }}
                    style={styles.listingImg}
                  />
                ) : (
                  <View style={[styles.listingImg, styles.imgPlaceholder]}>
                    <Ionicons name="image-outline" size={24} color={COLORS.border} />
                  </View>
                )}
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={2}>
                    {item.listing.title}
                  </Text>
                  <Text style={styles.dates}>
                    {new Date(item.start_date).toLocaleDateString("ru-RU")} —{" "}
                    {new Date(item.end_date).toLocaleDateString("ru-RU")}
                  </Text>
                  <Text style={styles.price}>{item.total_price} ₸</Text>
                </View>
              </TouchableOpacity>

              {item.renter && (
                <TouchableOpacity
                  style={styles.renterRow}
                  onPress={() => router.push(`/profile/${item.renter!.id}`)}
                >
                  {item.renter.avatar_url ? (
                    <Image
                      source={{ uri: `${API_URL}${item.renter.avatar_url}` }}
                      style={styles.renterAvatar}
                    />
                  ) : (
                    <View style={[styles.renterAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarLetter}>
                        {item.renter.name[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.renterName}>{item.renter.name}</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.muted} />
                </TouchableOpacity>
              )}

              <View style={styles.statusRow}>
                <RentalStatusBadge status={item.status} />
              </View>

              {item.status === "PENDING" && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => updateStatus({ id: item.id, status: "APPROVED" })}
                    disabled={isPending}
                  >
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    <Text style={styles.approveBtnText}>Одобрить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => updateStatus({ id: item.id, status: "REJECTED" })}
                    disabled={isPending}
                  >
                    <Ionicons name="close" size={16} color={COLORS.danger} />
                    <Text style={styles.rejectBtnText}>Отклонить</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === "APPROVED" && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => updateStatus({ id: item.id, status: "COMPLETED" })}
                  disabled={isPending}
                >
                  <Text style={styles.completeBtnText}>Завершить</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Входящих заявок нет</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  listingRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  listingImg: { width: 72, height: 72, borderRadius: 8 },
  imgPlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  listingInfo: { flex: 1 },
  listingTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 4 },
  dates: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  price: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  renterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 8,
  },
  renterAvatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  renterName: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.text },
  statusRow: { marginBottom: 10 },
  actions: { flexDirection: "row", gap: 10 },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rejectBtnText: { color: COLORS.danger, fontWeight: "600", fontSize: 14 },
  completeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  completeBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.muted },
});
