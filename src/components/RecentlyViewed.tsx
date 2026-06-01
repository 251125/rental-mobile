import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, resolveImageUrl } from "@/constants";
import { getRecentlyViewed, RecentItem } from "@/lib/recently-viewed";

export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  // Refresh on every focus so newly visited listings show up immediately
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void getRecentlyViewed().then((list) => {
        if (alive) setItems(list);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={16} color={COLORS.muted} />
        <Text style={styles.title}>Недавно просмотренные</Text>
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(it) => it.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/listings/${item.id}` as never)}
          >
            {item.image_url ? (
              <Image
                source={{ uri: resolveImageUrl(item.image_url) ?? "" }}
                style={styles.img}
              />
            ) : (
              <View style={[styles.img, styles.imgPlaceholder]}>
                <Ionicons name="image-outline" size={20} color={COLORS.border} />
              </View>
            )}
            <Text numberOfLines={1} style={styles.name}>
              {item.title}
            </Text>
            <Text style={styles.price}>
              {Number(item.price).toLocaleString()} ₸/день
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 12, gap: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    width: 130,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  img: {
    width: "100%",
    aspectRatio: 1.2,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  imgPlaceholder: { justifyContent: "center", alignItems: "center" },
  name: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  price: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
});
