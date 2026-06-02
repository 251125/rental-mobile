import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { confirm } from "@/lib/confirm";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useUserReviews } from "@/hooks/use-profile";
import { useOrCreateChat } from "@/hooks/use-chats";
import { useAuthStore } from "@/store/auth.store";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, resolveImageUrl } from "@/constants";
import { Review } from "@/types";
import ReportModal from "@/components/ReportModal";
import {
  useBlockUser,
  useUnblockUser,
  useBlockedUsers,
} from "@/hooks/use-blocks";
import { useT } from "@/i18n/useT";
import UserAvatar from "@/components/UserAvatar";

export default function PublicProfileScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user, isLoading } = useUser(id);
  const { data: reviews } = useUserReviews(id);
  const { mutate: openChat } = useOrCreateChat();
  const { user: me } = useAuthStore();

  const isMe = me?.id === id;
  const [reportVisible, setReportVisible] = useState(false);
  const { data: blockedList } = useBlockedUsers();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
  const isBlocked = !!blockedList?.some((b) => b.blocked_id === id);

  const confirmBlock = () => {
    confirm({
      title: t("Profile.blockTitle"),
      message: t("Profile.blockDesc"),
      cancelText: t("Common.cancel"),
      confirmText: t("Profile.blockUser"),
      destructive: true,
      onConfirm: () => blockUser(id),
    });
  };

  const handleChat = () => {
    openChat(id, {
      onSuccess: (chat) => router.push(`/chats/${chat.id}`),
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        <View style={styles.profileCard}>
          <UserAvatar url={user.avatar_url} name={user.name} size={88} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.rating_avg && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.rating}>
                {parseFloat(user.rating_avg).toFixed(1)}
              </Text>
              <Text style={styles.reviewsCount}>
                ({user.reviews_count})
              </Text>
            </View>
          )}
          <Text style={styles.since}>
            {t("Profile.joinedOn", { date: new Date(user.created_at).toLocaleDateString() })}
          </Text>

          {!isMe && (
            <>
              <View style={styles.actionBtns}>
                <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                  <Ionicons name="chatbubble-outline" size={16} color={COLORS.white} />
                  <Text style={styles.chatBtnText}>{t("Profile.writeBtn")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportBtn} onPress={() => setReportVisible(true)}>
                  <Ionicons name="flag-outline" size={16} color={COLORS.danger} />
                  <Text style={styles.reportBtnText}>{t("Profile.reportShort")}</Text>
                </TouchableOpacity>
              </View>
              {isBlocked ? (
                <TouchableOpacity
                  style={styles.unblockBtn}
                  onPress={() => unblockUser(id)}
                  disabled={isUnblocking}
                >
                  <Ionicons name="shield-outline" size={14} color={COLORS.warning} />
                  <Text style={styles.unblockText}>
                    {isUnblocking ? t("Profile.unblocking") : t("Profile.unblockUser")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.blockBtn}
                  onPress={confirmBlock}
                  disabled={isBlocking}
                >
                  <Ionicons name="ban-outline" size={14} color={COLORS.danger} />
                  <Text style={styles.blockText}>
                    {isBlocking ? t("Profile.blocking") : t("Profile.blockUser")}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {isBlocked && (
          <View style={styles.blockedNotice}>
            <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
            <Text style={styles.blockedNoticeText}>
              {t("Profile.blockDesc")}
            </Text>
          </View>
        )}

        <ReportModal
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          type="USER"
          targetId={id}
        />

        {reviews && reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>{t("Profile.reviewsLabel")}</Text>
            {reviews.map((review: Review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author.name}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= review.rating ? "star" : "star-outline"}
                        size={14}
                        color="#f59e0b"
                      />
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString("ru-RU")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  profileCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 36, fontWeight: "700", color: COLORS.primary },
  name: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  email: { fontSize: 13, color: COLORS.muted, marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  rating: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  reviewsCount: { fontSize: 13, color: COLORS.muted },
  since: { fontSize: 12, color: COLORS.muted, marginBottom: 16 },
  actionBtns: { flexDirection: "row", gap: 10, marginTop: 0 },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  chatBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#fee2e2",
    backgroundColor: "#fff5f5",
  },
  reportBtnText: { color: COLORS.danger, fontWeight: "600", fontSize: 14 },
  blockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: "#fff5f5",
  },
  blockText: { color: COLORS.danger, fontWeight: "600", fontSize: 13 },
  unblockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.warning,
    backgroundColor: "#fff7ed",
  },
  unblockText: { color: COLORS.warning, fontWeight: "600", fontSize: 13 },
  blockedNotice: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  blockedNoticeText: { fontSize: 12, color: COLORS.text, flex: 1, lineHeight: 17 },
  reviewsSection: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewAuthor: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 4 },
  reviewDate: { fontSize: 11, color: COLORS.muted },
});
