import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useUserReviews } from "@/hooks/use-profile";
import { useOrCreateChat } from "@/hooks/use-chats";
import { useAuthStore } from "@/store/auth.store";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, resolveImageUrl } from "@/constants";
import { Review } from "@/types";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user, isLoading } = useUser(id);
  const { data: reviews } = useUserReviews(id);
  const { mutate: openChat } = useOrCreateChat();
  const { user: me } = useAuthStore();

  const isMe = me?.id === id;

  const handleChat = () => {
    openChat(id, {
      onSuccess: (chat) => router.push(`/chats/${chat.id}`),
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return null;

  const avatarUri = user.avatar_url ? resolveImageUrl(user.avatar_url) ?? "" : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        <View style={styles.profileCard}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {user.name[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.rating_avg && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.rating}>
                {parseFloat(user.rating_avg).toFixed(1)}
              </Text>
              <Text style={styles.reviewsCount}>
                ({user.reviews_count} отзывов)
              </Text>
            </View>
          )}
          <Text style={styles.since}>
            На платформе с {new Date(user.created_at).toLocaleDateString("ru-RU")}
          </Text>

          {!isMe && (
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={COLORS.white}
              />
              <Text style={styles.chatBtnText}>Написать сообщение</Text>
            </TouchableOpacity>
          )}
        </View>

        {reviews && reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Отзывы</Text>
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
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  chatBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
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
