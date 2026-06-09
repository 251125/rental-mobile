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
  ScrollView,
} from "react-native";
import QRCode from "react-qr-code";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIncomingRentals, useUpdateRentalStatus, useMarkIncomingSeen } from "@/hooks/use-rentals";
import { useOrCreateChat } from "@/hooks/use-chats";
import RentalStatusBadge from "@/components/RentalStatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import DisputeModal from "@/components/DisputeModal";
import { COLORS, resolveImageUrl } from "@/constants";
import { RentalRequest } from "@/types";
import { useT } from "@/i18n/useT";

const MOBILE_BASE = typeof window !== "undefined" ? window.location.origin : "http://localhost:8082";

export default function IncomingRentalsScreen() {
  const t = useT();
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

  const { data: rentals, isLoading } = useIncomingRentals();
  const { mutate: updateStatus, isPending } = useUpdateRentalStatus();
  const { mutate: openChat } = useOrCreateChat();
  const { mutate: markSeen } = useMarkIncomingSeen();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [disputeRental, setDisputeRental] = useState<RentalRequest | null>(null);
  const [expandedTimeline, setExpandedTimeline] = useState<Set<string>>(new Set());
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const toggleTimeline = (id: string) => {
    setExpandedTimeline((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Clear "new requests" badge when the user opens this screen
  useEffect(() => {
    markSeen();
  }, [markSeen]);

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

              {item.renter && (
                <TouchableOpacity
                  style={styles.renterRow}
                  onPress={() => router.push(`/profile/${item.renter!.id}`)}
                >
                  {item.renter.avatar_url ? (
                    <Image
                      source={{ uri: resolveImageUrl(item.renter.avatar_url) ?? "" }}
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
                    <Text style={styles.approveBtnText}>{t("Rental.approveBtn")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => updateStatus({ id: item.id, status: "REJECTED" })}
                    disabled={isPending}
                  >
                    <Ionicons name="close" size={16} color={COLORS.danger} />
                    <Text style={styles.rejectBtnText}>{t("Rental.rejectBtn")}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === "APPROVED" && (
                <View style={styles.approvedActions}>
                  <View style={styles.approvedRow}>
                    {item.payment_status === "UNPAID" && item.qr_token && (
                      <TouchableOpacity
                        style={styles.qrBtn}
                        onPress={() => setQrToken(item.qr_token!)}
                      >
                        <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.qrBtnText} numberOfLines={1}>{t("Rental.qrBtn")}</Text>
                      </TouchableOpacity>
                    )}
                    {item.renter && (
                      <TouchableOpacity
                        style={styles.msgBtn}
                        onPress={() =>
                          openChat(item.renter_id, {
                            onSuccess: (chat) => router.push(`/chats/${chat.id}` as never),
                          })
                        }
                      >
                        <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.msgBtnText}>{t("Rental.writeBtn")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.completeBtn,
                      (isPending || item.payment_status !== "PAID" || !item.return_images?.length) && styles.completeBtnDisabled,
                    ]}
                    onPress={() => updateStatus({ id: item.id, status: "COMPLETED" })}
                    disabled={isPending || item.payment_status !== "PAID" || !item.return_images?.length}
                  >
                    <Text style={styles.completeBtnText}>{t("Rental.completeBtn")}</Text>
                  </TouchableOpacity>
                  {item.payment_status === "PAID" && !item.return_images?.length && (
                    <Text style={styles.returnPhotoHint}>{t("Rental.waitingReturnPhoto")}</Text>
                  )}
                  {item.payment_status === "PAID" && !item.dispute && (
                    <TouchableOpacity
                      style={styles.disputeBtn}
                      onPress={() => setDisputeRental(item)}
                    >
                      <Ionicons
                        name="warning-outline"
                        size={14}
                        color={COLORS.warning}
                      />
                      <Text style={styles.disputeBtnText}>{t("Rental.openDisputeBtn")}</Text>
                    </TouchableOpacity>
                  )}
                  {item.dispute && (
                    <TouchableOpacity
                      style={styles.disputeOpenBtn}
                      onPress={() => router.push("/disputes" as never)}
                    >
                      <Ionicons name="shield-outline" size={14} color={COLORS.warning} />
                      <Text style={styles.disputeBtnText}>
                        {item.dispute.status === "OPEN" ? t("Rental.disputeOpenLabel") : t("Rental.disputeClosedLabel")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Return photos */}
              {(item.return_images ?? []).length > 0 && (
                <View style={styles.returnThumbsRow}>
                  {(item.return_images ?? []).map((url, idx) => (
                    <TouchableOpacity key={idx} onPress={() => setViewerUri(resolveImageUrl(url) ?? url)}>
                      <Image source={{ uri: resolveImageUrl(url) ?? url }} style={styles.returnThumb} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* History toggle */}
              <TouchableOpacity
                style={styles.timelineToggle}
                onPress={() => toggleTimeline(item.id)}
              >
                <Ionicons
                  name={expandedTimeline.has(item.id) ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={COLORS.muted}
                />
                <Text style={styles.timelineToggleText}>{t("Rental.historyBtn")}</Text>
              </TouchableOpacity>
              {expandedTimeline.has(item.id) && (
                <View style={styles.timeline}>
                  {[
                    { label: t("Rental.stageCreated"), done: true, date: item.created_at },
                    { label: t("Rental.stageApproved"), done: item.status === "APPROVED" || item.status === "COMPLETED", failed: item.status === "REJECTED" || item.status === "CANCELLED" },
                    { label: t("Rental.stagePayment"), done: item.payment_status === "PAID" },
                    { label: t("Rental.stageCompleted"), done: item.status === "COMPLETED" },
                  ].map((step, i) => (
                    <View key={i} style={styles.timelineRow}>
                      <View style={[styles.dot, step.done && styles.dotDone, step.failed && styles.dotFailed]}>
                        {step.done && <Ionicons name="checkmark" size={11} color={COLORS.white} />}
                        {step.failed && <Ionicons name="close" size={11} color={COLORS.white} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.timelineLabel, !step.done && !step.failed && { color: COLORS.muted }, step.failed && { textDecorationLine: "line-through", color: COLORS.danger }]}>
                          {step.label}
                        </Text>
                        {step.date && <Text style={styles.timelineDate}>{new Date(step.date).toLocaleString("ru-RU")}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>{t("Rental.emptyIncoming")}</Text>
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

      <Modal visible={!!viewerUri} transparent animationType="fade" onRequestClose={() => setViewerUri(null)}>
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerUri(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {viewerUri && <Image source={{ uri: viewerUri }} style={styles.viewerImage} resizeMode="contain" />}
        </View>
      </Modal>

      <Modal visible={!!qrToken} transparent animationType="fade" onRequestClose={() => setQrToken(null)}>
        <View style={styles.qrOverlay}>
          <View style={styles.qrSheet}>
            <Text style={styles.qrTitle}>QR-код для оплаты</Text>
            <Text style={styles.qrSub}>{t("Rental.qrShowToRenter")}</Text>
            {qrToken && (
              <View style={styles.qrBox}>
                <QRCode value={`${MOBILE_BASE}/rentals/scan/${qrToken}`} size={220} />
              </View>
            )}
            <TouchableOpacity style={styles.qrCloseBtn} onPress={() => setQrToken(null)}>
              <Text style={styles.qrCloseBtnText}>{t("Rental.qrClose")}</Text>
            </TouchableOpacity>
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
  approvedActions: { gap: 8 },
  approvedRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  msgBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  msgBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  qrBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  qrBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  completeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  completeBtnDisabled: { backgroundColor: COLORS.muted, opacity: 0.5 },
  completeBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
  returnPhotoHint: { fontSize: 11, color: COLORS.muted, textAlign: "center" },
  disputeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  disputeOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
    backgroundColor: "#fff7ed",
  },
  disputeBtnText: { color: COLORS.warning, fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.muted },
  returnThumbsRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  returnThumb: { width: 64, height: 64, borderRadius: 8 },
  timelineToggle: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  timelineToggleText: { fontSize: 13, color: COLORS.muted },
  timeline: { marginTop: 10, gap: 10 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", marginTop: 2 },
  dotDone: { borderColor: COLORS.success, backgroundColor: COLORS.success },
  dotFailed: { borderColor: COLORS.danger, backgroundColor: COLORS.danger },
  timelineLabel: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  timelineDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
  viewerClose: { position: "absolute", top: 48, right: 20, zIndex: 1, padding: 8 },
  viewerImage: { width: "100%", height: "80%" },
  qrOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  qrSheet: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  qrTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  qrSub: { fontSize: 13, color: COLORS.muted, marginBottom: 20, textAlign: "center" },
  qrBox: {
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  qrCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  qrCloseBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});
