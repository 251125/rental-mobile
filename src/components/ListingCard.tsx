import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Listing } from "@/types";
import { COLORS, resolveImageUrl } from "@/constants";
import { useCompareStore } from "@/store/compare.store";
import Toast from "react-native-toast-message";

interface Props {
  listing: Listing;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
}

export default function ListingCard({ listing, onFavoriteToggle, isFavorite }: Props) {
  const imageUrl = resolveImageUrl(listing.images[0]?.image_url);
  const { add, remove, has, validate, items } = useCompareStore();
  const inCompare = has(listing.id);

  const toggleCompare = () => {
    if (inCompare) {
      remove(listing.id);
      return;
    }
    const err = validate(listing);
    if (err) {
      Toast.show({ type: "error", text1: err });
      return;
    }
    add(listing);
    Toast.show({ type: "success", text1: "Добавлено к сравнению" });
    if (items.length + 1 >= 2) {
      router.push("/compare");
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/listings/${listing.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={40} color={COLORS.border} />
          </View>
        )}
        {listing.promoted_until &&
          new Date(listing.promoted_until).getTime() > Date.now() && (
            <View style={styles.featuredBadge}>
              <Ionicons name="sparkles" size={11} color="#fff" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        <View style={styles.imgOverlay}>
          {onFavoriteToggle && (
            <TouchableOpacity style={styles.overlayBtn} onPress={onFavoriteToggle}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? COLORS.danger : COLORS.white}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.overlayBtn, inCompare && styles.overlayBtnActive]}
            onPress={toggleCompare}
          >
            <Ionicons
              name="git-compare-outline"
              size={18}
              color={inCompare ? COLORS.primary : COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.city}>
          📍 {listing.city}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{Number(listing.price).toLocaleString()} ₸/день</Text>
          <View style={styles.rightMeta}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#f59e0b" />
              <Text style={styles.ratingText}>
                {listing.rating_avg ? parseFloat(String(listing.rating_avg)).toFixed(1) : "—"}
              </Text>
            </View>
            <Text style={styles.category}>{listing.category.name}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: { position: "relative" },
  image: { width: "100%", height: 180 },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  imgOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "column",
    gap: 6,
  },
  overlayBtn: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    padding: 6,
  },
  overlayBtnActive: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#f59e0b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  featuredText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  info: { padding: 12 },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  city: { fontSize: 12, color: COLORS.muted, marginBottom: 8 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  rightMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 11, color: COLORS.muted, fontWeight: "600" },
  category: {
    fontSize: 11,
    color: COLORS.muted,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});
