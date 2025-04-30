import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Listing } from "@/types";
import { COLORS } from "@/constants";
import { API_URL } from "@/constants";

interface Props {
  listing: Listing;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
}

export default function ListingCard({
  listing,
  onFavoriteToggle,
  isFavorite,
}: Props) {
  const imageUrl =
    listing.images[0]?.image_url
      ? `${API_URL}${listing.images[0].image_url}`
      : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/listings/${listing.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={40} color={COLORS.border} />
          </View>
        )}
        {onFavoriteToggle && (
          <TouchableOpacity style={styles.favBtn} onPress={onFavoriteToggle}>
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite ? COLORS.danger : COLORS.white}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.city}>
          <Ionicons name="location-outline" size={12} color={COLORS.muted} />{" "}
          {listing.city}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{listing.price} ₸/день</Text>
          <Text style={styles.category}>{listing.category.name}</Text>
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
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 180,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    padding: 6,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  city: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  category: {
    fontSize: 11,
    color: COLORS.muted,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});
