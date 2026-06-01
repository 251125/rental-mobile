import React, { useState, useEffect } from "react";
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
  Alert,
  Platform,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMyRentals, useCancelRental } from "@/hooks/use-rentals";
import { useCreateReview } from "@/hooks/use-reviews";
import { useOrCreateChat } from "@/hooks/use-chats";
import { useUploadImage } from "@/hooks/use-listings";
import { usePayRental } from "@/hooks/use-wallet";
import RentalStatusBadge from "@/components/RentalStatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import DisputeModal from "@/components/DisputeModal";
import { COLORS, resolveImageUrl, API_URL } from "@/constants";
import { RentalRequest } from "@/types";
import api from "@/services/api";
import Toast from "react-native-toast-message";

function calcProgress(startDate: string, endDate: string): number {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (end <= start) return 100;
  const raw = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, raw));
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

function daysElapsed(startDate: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((Date.now() - new Date(startDate).getTime()) / msPerDay));
}

function ProgressBar({ startDate, endDate }: { startDate: string; endDate: string }) {
  const pct = calcProgress(startDate, endDate);
  const elapsed = Math.min(daysElapsed(startDate), daysBetween(startDate, endDate));
  const total = daysBetween(startDate, endDate);
  return (
    <View style={progressStyles.wrap}>
      <View style={progressStyles.labelRow}>
        <Text style={progressStyles.label}>Прогресс аренды</Text>
        <Text style={progressStyles.label}>
          {elapsed} дн. из {total}
        </Text>
      </View>
      <View style={progressStyles.track}>
        <View style={[progressStyles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

interface TimelineStep {
  label: string;
  status: "done" | "pending" | "failed";
  date?: string;
}

function buildTimeline(rental: RentalRequest): TimelineStep[] {
  const approvedDone = rental.status === "APPROVED" || rental.status === "COMPLETED";
  const approvedFailed = rental.status === "REJECTED" || rental.status === "CANCELLED";
  return [
    { label: "Заявка создана", status: "done", date: rental.created_at },
    {
      label: "Одобрено",
      status: approvedDone ? "done" : approvedFailed ? "failed" : "pending",
    },
    { label: "Оплата", status: rental.payment_status === "PAID" ? "done" : "pending" },
    { label: "Завершено", status: rental.status === "COMPLETED" ? "done" : "pending" },
  ];
}

function Timeline({ rental }: { rental: RentalRequest }) {
  const steps = buildTimeline(rental);
  return (
    <View style={timelineStyles.wrap}>
      {steps.map((step, i) => (
        <View key={i} style={timelineStyles.row}>
          <View
            style={[
              timelineStyles.dot,
              step.status === "done" && timelineStyles.dotDone,
              step.status === "failed" && timelineStyles.dotFailed,
            ]}
          >
            {step.status === "done" && (
              <Ionicons name="checkmark" size={11} color={COLORS.white} />
            )}
            {step.status === "failed" && (
              <Ionicons name="close" size={11} color={COLORS.white} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                timelineStyles.label,
                step.status === "pending" && { color: COLORS.muted },
                step.status === "failed" && {
                  textDecorationLine: "line-through",
                  color: COLORS.danger,
                },
              ]}
            >
              {step.label}
            </Text>
            {step.date && (
              <Text style={timelineStyles.date}>
                {new Date(step.date).toLocaleString("ru-RU")}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  wrap: { marginTop: 10 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 11, color: COLORS.muted },
  track: { height: 6, borderRadius: 3, backgroundColor: COLORS.border, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: COLORS.primary },
});

const timelineStyles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 10 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  dotDone: { borderColor: COLORS.success, backgroundColor: COLORS.success },
  dotFailed: { borderColor: COLORS.danger, backgroundColor: COLORS.danger },
  label: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  date: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
});

export default function MyRentalsScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const { data: rentals, isLoading } = useMyRentals();
  const { mutate: cancelRental } = useCancelRental();
  const { mutate: createReview, isPending: isReviewing } = useCreateReview();
  const { mutate: openChat } = useOrCreateChat();
  const { mutateAsync: uploadImage } = useUploadImage();
  const { mutate: payRental, isPending: isPaying } = usePayRental();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [expandedTimeline, setExpandedTimeline] = useState<Set<string>>(new Set());
  const toggleTimeline = (id: string) => {
    setExpandedTimeline((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalRequest | null>(null);
  const [disputeRental, setDisputeRental] = useState<RentalRequest | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [returnImages, setReturnImages] = useState<Record<string, string[]>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleReturnPhoto = (rentalId: string) => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.onchange = async () => {
        const files = Array.from(input.files ?? []);
        if (!files.length) return;
        setUploadingId(rentalId);
        try {
          const urls = await Promise.all(
            files.map((file) => {
              const uri = URL.createObjectURL(file);
              return uploadImage(uri);
            }),
          );
          await api.post(`${API_URL}/rental-requests/${rentalId}/return-images`, { images: urls });
          setReturnImages((prev) => ({
            ...prev,
            [rentalId]: [...(prev[rentalId] ?? []), ...urls],
          }));
          Toast.show({ type: "success", text1: "Фото возврата загружены" });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Ошибка загрузки";
          Toast.show({ type: "error", text1: msg });
        } finally {
          setUploadingId(null);
        }
      };
      input.click();
      return;
    }
    Alert.alert("Фото возврата", "Выберите способ", [
      {
        text: "Галерея",
        onPress: () => pickReturnPhoto(rentalId, "gallery"),
      },
      {
        text: "Камера",
        onPress: () => pickReturnPhoto(rentalId, "camera"),
      },
      { text: "Отмена", style: "cancel" },
    ]);
  };

  const pickReturnPhoto = async (rentalId: string, source: "gallery" | "camera") => {
    let result;
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        Toast.show({ type: "error", text1: "Нет доступа к камере" });
        return;
      }
      result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    }
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setUploadingId(rentalId);
    try {
      const url = await uploadImage(uri);
      await api.post(`${API_URL}/rental-requests/${rentalId}/return-images`, { images: [url] });
      setReturnImages((prev) => ({
        ...prev,
        [rentalId]: [...(prev[rentalId] ?? []), url],
      }));
      Toast.show({ type: "success", text1: "Фото возврата загружено" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setUploadingId(null);
    }
  };

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

              {item.status === "APPROVED" && (
                <ProgressBar startDate={item.start_date} endDate={item.end_date} />
              )}

              <View style={styles.actions}>
                {item.status === "APPROVED" && item.payment_status === "UNPAID" && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.payBtn,
                        isPaying && payingId === item.id && styles.payBtnDisabled,
                      ]}
                      disabled={isPaying && payingId === item.id}
                      onPress={() => {
                        setPayingId(item.id);
                        payRental(item.id, {
                          onSettled: () => setPayingId(null),
                        });
                      }}
                    >
                      <Ionicons name="card-outline" size={14} color={COLORS.white} />
                      <Text style={styles.payBtnText}>
                        {isPaying && payingId === item.id ? "Оплата..." : "Оплатить сейчас"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.scanBtn}
                      onPress={() => router.push("/rentals/qr-scanner" as never)}
                    >
                      <Ionicons name="scan-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.scanBtnText}>QR</Text>
                    </TouchableOpacity>
                  </>
                )}
                {item.status === "APPROVED" && (
                  <TouchableOpacity
                    style={styles.msgBtn}
                    onPress={() =>
                      openChat(item.listing.owner_id, {
                        onSuccess: (chat) => router.push(`/chats/${chat.id}` as never),
                      })
                    }
                  >
                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.msgBtnText}>Написать</Text>
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
                {item.status === "APPROVED" && item.payment_status === "PAID" && (
                  <TouchableOpacity
                    style={styles.returnPhotoBtn}
                    onPress={() => handleReturnPhoto(item.id)}
                    disabled={uploadingId === item.id}
                  >
                    <Ionicons name="camera-outline" size={14} color={COLORS.white} />
                    <Text style={styles.returnPhotoBtnText}>
                      {uploadingId === item.id ? "Загрузка..." : "Фото возврата"}
                    </Text>
                  </TouchableOpacity>
                )}
                {item.status === "APPROVED" &&
                  item.payment_status === "PAID" &&
                  !item.dispute && (
                    <TouchableOpacity
                      style={styles.disputeBtn}
                      onPress={() => setDisputeRental(item)}
                    >
                      <Ionicons
                        name="warning-outline"
                        size={14}
                        color={COLORS.warning}
                      />
                      <Text style={styles.disputeBtnText}>Открыть спор</Text>
                    </TouchableOpacity>
                  )}
                {item.dispute && (
                  <TouchableOpacity
                    style={styles.disputeOpenBtn}
                    onPress={() => router.push("/disputes" as never)}
                  >
                    <Ionicons
                      name="shield-outline"
                      size={14}
                      color={COLORS.warning}
                    />
                    <Text style={styles.disputeBtnText}>
                      {item.dispute.status === "OPEN" ? "Спор открыт" : "Спор закрыт"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {(returnImages[item.id] ?? []).length > 0 && (
                <View style={styles.returnThumbsRow}>
                  {(returnImages[item.id] ?? []).map((url, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: resolveImageUrl(url) ?? url }}
                      style={styles.returnThumb}
                    />
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.timelineToggle}
                onPress={() => toggleTimeline(item.id)}
              >
                <Ionicons
                  name={
                    expandedTimeline.has(item.id) ? "chevron-up" : "chevron-down"
                  }
                  size={14}
                  color={COLORS.muted}
                />
                <Text style={styles.timelineToggleText}>История</Text>
              </TouchableOpacity>
              {expandedTimeline.has(item.id) && <Timeline rental={item} />}
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

      {disputeRental && (
        <DisputeModal
          rental={disputeRental}
          visible={!!disputeRental}
          onClose={() => setDisputeRental(null)}
        />
      )}

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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 13 },
  payBtnDisabled: { opacity: 0.6 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  timelineToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timelineToggleText: { fontSize: 13, color: COLORS.muted },
  msgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  msgBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
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
  returnPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  returnPhotoBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 13 },
  disputeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disputeOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.warning,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disputeBtnText: { color: COLORS.warning, fontWeight: "600", fontSize: 13 },
  returnThumbsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  returnThumb: { width: 64, height: 64, borderRadius: 8 },
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
