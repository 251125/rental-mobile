import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  FlatList,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useListing, useDeleteListing } from "@/hooks/use-listings";
import { useMyFavorites, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useCreateRentalRequest } from "@/hooks/use-rentals";
import { useOrCreateChat } from "@/hooks/use-chats";
import { useAuthStore } from "@/store/auth.store";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, resolveImageUrl } from "@/constants";

const { width } = Dimensions.get("window");

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id);
  const { data: favorites } = useMyFavorites();
  const { mutate: addFav } = useAddFavorite();
  const { mutate: removeFav } = useRemoveFavorite();
  const { mutate: createRental, isPending: isRenting } = useCreateRentalRequest();
  const { mutate: deleteListing } = useDeleteListing();
  const { mutate: openChat } = useOrCreateChat();
  const { user } = useAuthStore();

  const [rentalModal, setRentalModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imgIndex, setImgIndex] = useState(0);

  if (isLoading) return <LoadingSpinner />;
  if (!listing) return null;

  const isFav = favorites?.some((f) => f.listing_id === listing.id) ?? false;
  const isOwner = user?.id === listing.owner_id;

  const toggleFav = () => {
    if (isFav) removeFav(listing.id);
    else addFav(listing.id);
  };

  const handleRent = () => {
    if (!startDate || !endDate) return;
    createRental(
      { listing_id: listing.id, start_date: startDate, end_date: endDate },
      { onSuccess: () => { setRentalModal(false); setStartDate(""); setEndDate(""); } },
    );
  };

  const handleDelete = () => {
    Alert.alert("Удалить объявление?", "Это действие необратимо", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => deleteListing(listing.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const handleChat = () => {
    openChat(listing.owner_id, {
      onSuccess: (chat) => router.push(`/chats/${chat.id}`),
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {listing.images.length > 0 ? (
        <View>
          <FlatList
            data={listing.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) =>
              setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <Image
                source={{ uri: resolveImageUrl(item.image_url) ?? "" }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          />
          {listing.images.length > 1 && (
            <View style={styles.dots}>
              {listing.images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === imgIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={60} color={COLORS.border} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <TouchableOpacity onPress={toggleFav}>
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={26}
              color={isFav ? COLORS.danger : COLORS.muted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.muted} />
            <Text style={styles.metaText}>{listing.city}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="grid-outline" size={14} color={COLORS.muted} />
            <Text style={styles.metaText}>{listing.category.name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={14} color={COLORS.muted} />
            <Text style={styles.metaText}>{listing.views_count}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{listing.price} ₸/день</Text>
          <Text style={styles.deposit}>Залог: {listing.deposit} ₸</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Описание</Text>
        <Text style={styles.description}>{listing.description}</Text>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.ownerRow}
          onPress={() => router.push(`/profile/${listing.owner_id}`)}
        >
          <View style={styles.ownerInfo}>
            {listing.owner.avatar_url ? (
              <Image
                source={{ uri: resolveImageUrl(listing.owner.avatar_url) ?? "" }}
                style={styles.ownerAvatar}
              />
            ) : (
              <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder]}>
                <Text style={styles.ownerAvatarLetter}>
                  {listing.owner.name[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.ownerName}>{listing.owner.name}</Text>
              {listing.owner.rating_avg && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.ratingText}>
                    {parseFloat(listing.owner.rating_avg).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
        </TouchableOpacity>

        {isOwner ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/listings/edit/${listing.id}`)}
            >
              <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              <Text style={styles.deleteBtnText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              <Text style={styles.chatBtnText}>Написать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rentBtn}
              onPress={() => setRentalModal(true)}
            >
              <Text style={styles.rentBtnText}>Арендовать</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={rentalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Оформить аренду</Text>
            <Text style={styles.modalLabel}>Дата начала (ГГГГ-ММ-ДД)</Text>
            <TextInput
              style={styles.modalInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2025-06-01"
              placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.modalLabel}>Дата окончания (ГГГГ-ММ-ДД)</Text>
            <TextInput
              style={styles.modalInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2025-06-10"
              placeholderTextColor={COLORS.muted}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setRentalModal(false)}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, isRenting && { opacity: 0.6 }]}
                onPress={handleRent}
                disabled={isRenting}
              >
                <Text style={styles.modalConfirmText}>
                  {isRenting ? "..." : "Отправить"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  image: { width, height: 260 },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: -20,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: COLORS.white, width: 18 },
  content: { padding: 16 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginRight: 12,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: COLORS.muted },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 16,
  },
  price: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  deposit: { fontSize: 13, color: COLORS.muted },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  ownerInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22 },
  ownerAvatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  ownerAvatarLetter: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  ownerName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  ratingText: { fontSize: 12, color: COLORS.muted },
  actions: { flexDirection: "row", gap: 10, marginBottom: 24 },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  chatBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  rentBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  rentBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  ownerActions: { flexDirection: "row", gap: 10, marginBottom: 24 },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  editBtnText: { color: COLORS.primary, fontWeight: "600" },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  deleteBtnText: { color: COLORS.danger, fontWeight: "600" },
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
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  modalLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginTop: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
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
