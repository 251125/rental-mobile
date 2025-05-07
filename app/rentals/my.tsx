import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Modal,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMyRentals, useCancelRental } from "@/hooks/use-rentals";
import { usePayRental } from "@/hooks/use-wallet";
import { useCreateReview } from "@/hooks/use-reviews";
import RentalStatusBadge from "@/components/RentalStatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, resolveImageUrl } from "@/constants";
import { RentalRequest } from "@/types";

export default function MyRentalsScreen() {
  const { data: rentals, isLoading } = useMyRentals();
  const { mutate: cancelRental } = useCancelRental();
  const { mutate: payRental } = usePayRental();
  const { mutate: createReview, isPending: isReviewing } = useCreateReview();

  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalRequest | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = () => {
    if (!selectedRental) return;
    createReview(
      {
        rental_request_id: selectedRental.id,
        target_user_id: selectedRental.listing.owner_id,
        rating,
        comment: comment || undefined,
      },
      { onSuccess: () => { setReviewModal(false); setComment(""); setRating(5); } },
    );
  };

  const canReview = (rental: RentalRequest) =>
    rental.status === "COMPLETED" &&
    (!rental.reviews || rental.reviews.length === 0);

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
                    source={{ uri: resolveImageUrl(img.image_url) ?? "" }}
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

              <View style={styles.statusRow}>
                <RentalStatusBadge status={item.status} />
                <Text
                  style={[
                    styles.payStatus,
                    item.payment_status === "PAID"
                      ? { color: COLORS.success }
                      : { color: COLORS.warning },
                  ]}
                >
                  {item.payment_status === "PAID" ? "Оплачено" : "Не оплачено"}
                </Text>
              </View>

              <View style={styles.actions}>
                {item.status === "APPROVED" && item.payment_status === "UNPAID" && (
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => payRental(item.id)}
                  >
                    <Text style={styles.payBtnText}>Оплатить</Text>
                  </TouchableOpacity>
                )}
                {(item.status === "PENDING" || item.status === "APPROVED") && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => cancelRental(item.id)}
                  >
                    <Text style={styles.cancelBtnText}>Отменить</Text>
                  </TouchableOpacity>
                )}
                {canReview(item) && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => { setSelectedRental(item); setReviewModal(true); }}
                  >
                    <Ionicons name="star-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.reviewBtnText}>Оставить отзыв</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Заявок на аренду нет</Text>
          </View>
        }
      />

      <Modal visible={reviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Оставить отзыв</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons
                    name={s <= rating ? "star" : "star-outline"}
                    size={32}
                    color="#f59e0b"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Комментарий (необязательно)"
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setReviewModal(false)}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, isReviewing && { opacity: 0.6 }]}
                onPress={submitReview}
                disabled={isReviewing}
              >
                <Text style={styles.modalConfirmText}>
                  {isReviewing ? "..." : "Отправить"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  payStatus: { fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  payBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 13 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: { color: COLORS.danger, fontWeight: "600", fontSize: 13 },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.muted },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  starsRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  reviewInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    height: 80,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  modalCancelText: { color: COLORS.muted, fontWeight: "600" },
  modalConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  modalConfirmText: { color: COLORS.white, fontWeight: "700" },
});
