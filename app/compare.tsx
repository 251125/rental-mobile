import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCompareStore } from "@/store/compare.store";
import { COLORS, resolveImageUrl } from "@/constants";

const { width } = Dimensions.get("window");
const COL = Math.max((width - 32) / 3, 100);

const ROWS: { label: string; key: string; format?: (v: unknown) => string }[] = [
  { label: "Цена/день", key: "price", format: (v) => `${Number(v).toLocaleString()} ₸` },
  { label: "Залог", key: "deposit", format: (v) => `${Number(v).toLocaleString()} ₸` },
  { label: "Рейтинг", key: "rating_avg", format: (v) => v ? `★ ${parseFloat(String(v)).toFixed(1)}` : "—" },
  { label: "Просмотры", key: "views_count", format: (v) => String(v) },
  { label: "Город", key: "city" },
  { label: "Категория", key: "category", format: (v) => (v as { name: string })?.name ?? "—" },
];

export default function CompareScreen() {
  const navigation = useNavigation();
  const { items, remove, clear } = useCompareStore();

  useEffect(() => {
    navigation.setOptions({
      title: "Сравнение",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace("/(tabs)")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: 4 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
      headerRight: () =>
        items.length > 0 ? (
          <TouchableOpacity
            onPress={clear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginRight: 4 }}
          >
            <Text style={{ fontSize: 13, color: COLORS.danger, fontWeight: "600" }}>Очистить</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="git-compare-outline" size={56} color={COLORS.border} />
        <Text style={styles.emptyTitle}>Нет объявлений для сравнения</Text>
        <Text style={styles.emptyText}>
          Нажмите{" "}
          <Ionicons name="git-compare-outline" size={14} color={COLORS.muted} />
          {" "}на карточке объявления чтобы добавить его сюда
        </Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.browseBtnText}>Смотреть объявления</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lowestPrice = Math.min(...items.map((i) => Number(i.price)));
  const highestRating = Math.max(...items.map((i) => i.rating_avg ? parseFloat(String(i.rating_avg)) : 0));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={[styles.labelCell, { width: 100 }]} />
            {items.map((item) => {
              const imgUrl = resolveImageUrl(item.images[0]?.image_url);
              return (
                <View key={item.id} style={[styles.headerCell, { width: COL }]}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.headerImg} />
                  ) : (
                    <View style={[styles.headerImg, styles.headerImgPlaceholder]}>
                      <Ionicons name="image-outline" size={28} color={COLORS.border} />
                    </View>
                  )}
                  <Text style={styles.headerTitle} numberOfLines={2}>{item.title}</Text>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => remove(item.id)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close-circle" size={20} color={COLORS.muted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Data rows */}
          {ROWS.map((row, rowIdx) => (
            <View key={row.key} style={[styles.dataRow, rowIdx % 2 === 1 && styles.dataRowAlt]}>
              <View style={[styles.labelCell, { width: 100 }]}>
                <Text style={styles.labelText}>{row.label}</Text>
              </View>
              {items.map((item) => {
                const raw = item[row.key as keyof typeof item];
                const val = row.format ? row.format(raw) : String(raw ?? "—");

                const isLowest = row.key === "price" && Number(item.price) === lowestPrice;
                const isTopRated = row.key === "rating_avg" && item.rating_avg &&
                  parseFloat(String(item.rating_avg)) === highestRating && highestRating > 0;
                const highlight = isLowest || isTopRated;

                return (
                  <View key={item.id} style={[styles.dataCell, { width: COL }, highlight && styles.dataCellHighlight]}>
                    <Text style={[styles.dataText, highlight && styles.dataTextHighlight]}>
                      {val}
                    </Text>
                    {isLowest && <Text style={styles.badgeText}>выгодно</Text>}
                    {isTopRated && <Text style={styles.badgeText}>топ</Text>}
                  </View>
                );
              })}
            </View>
          ))}

          {/* CTA row */}
          <View style={styles.dataRow}>
            <View style={[styles.labelCell, { width: 100 }]} />
            {items.map((item) => (
              <View key={item.id} style={[styles.dataCell, { width: COL }]}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => router.push(`/listings/${item.id}`)}
                >
                  <Text style={styles.viewBtnText}>Открыть</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
    backgroundColor: COLORS.white,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  emptyText: { fontSize: 13, color: COLORS.muted, textAlign: "center", lineHeight: 20 },
  browseBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },

  headerRow: { flexDirection: "row", backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerCell: {
    padding: 10,
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    position: "relative",
  },
  headerImg: { width: "100%", height: 80, borderRadius: 8, marginBottom: 6 },
  headerImgPlaceholder: { backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 12, fontWeight: "600", color: COLORS.text, textAlign: "center" },
  removeBtn: { position: "absolute", top: 6, right: 6 },

  dataRow: { flexDirection: "row", backgroundColor: COLORS.white },
  dataRowAlt: { backgroundColor: COLORS.background },
  labelCell: { padding: 12, justifyContent: "center" },
  labelText: { fontSize: 12, fontWeight: "600", color: COLORS.muted },
  dataCell: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  dataCellHighlight: { backgroundColor: "#dbeafe" },
  dataText: { fontSize: 13, color: COLORS.text, fontWeight: "500", textAlign: "center" },
  dataTextHighlight: { color: COLORS.primary, fontWeight: "700" },
  badgeText: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    overflow: "hidden",
  },
  viewBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  viewBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 12 },
});
