import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useListings, useCategories } from "@/hooks/use-listings";
import { useMyFavorites, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useAuthStore } from "@/store/auth.store";
import ListingCard from "@/components/ListingCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS } from "@/constants";
import { ListingFilters } from "@/types";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<ListingFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const activeFilterCount =
    (filters.city ? 1 : 0) +
    (filters.price_min ? 1 : 0) +
    (filters.price_max ? 1 : 0);

  const { data, isLoading } = useListings(filters);
  const { data: categories } = useCategories();
  const { data: favorites } = useMyFavorites();
  const { mutate: addFav } = useAddFavorite();
  const { mutate: removeFav } = useRemoveFavorite();

  const favoriteIds = new Set(favorites?.map((f) => f.listing_id) ?? []);

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: search || undefined,
      category_ids: selectedCategory ? [selectedCategory] : undefined,
      page: 1,
    }));
  };

  const handleCategoryPress = (id: string | null) => {
    setSelectedCategory(id);
    setFilters((prev) => ({
      ...prev,
      category_ids: id ? [id] : undefined,
      page: 1,
    }));
  };

  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      city: cityInput.trim() || undefined,
      price_min: priceMin ? Number(priceMin) : undefined,
      price_max: priceMax ? Number(priceMax) : undefined,
      page: 1,
    }));
    setShowFilters(false);
  };

  const resetFilters = () => {
    setCityInput("");
    setPriceMin("");
    setPriceMax("");
    setFilters((prev) => ({
      ...prev,
      city: undefined,
      price_min: undefined,
      price_max: undefined,
      page: 1,
    }));
    setShowFilters(false);
  };

  const toggleFavorite = (listingId: string) => {
    if (favoriteIds.has(listingId)) removeFav(listingId);
    else addFav(listingId);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rental</Text>
        {user?.role === "ADMIN" && (
          <TouchableOpacity onPress={() => router.push("/admin")}>
            <Ionicons name="shield-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск объявлений..."
            placeholderTextColor={COLORS.muted}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); setFilters((p) => ({ ...p, search: undefined })); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Найти</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? COLORS.white : COLORS.primary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <View style={styles.categoriesWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[styles.catChip, !selectedCategory && styles.catChipActive]}
              onPress={() => handleCategoryPress(null)}
            >
              <Text style={[styles.catText, !selectedCategory && styles.catTextActive]}>
                Все
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
                onPress={() => handleCategoryPress(cat.id)}
              >
                <Text style={[styles.catText, selectedCategory === cat.id && styles.catTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Listings */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              isFavorite={favoriteIds.has(item.id)}
              onFavoriteToggle={() => toggleFavorite(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Объявления не найдены</Text>
            </View>
          }
          ListFooterComponent={
            data && data.meta.page < data.meta.total_pages ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
              >
                <Text style={styles.loadMoreText}>Загрузить ещё</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/listings/create")}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        />
        <View style={styles.filterSheet}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Фильтры</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Город</Text>
          <TextInput
            style={styles.filterInput}
            value={cityInput}
            onChangeText={setCityInput}
            placeholder="Например: Алматы"
            placeholderTextColor={COLORS.muted}
          />

          <Text style={styles.filterLabel}>Цена (₸/день)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.filterInput, styles.priceInput]}
              value={priceMin}
              onChangeText={setPriceMin}
              placeholder="От"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
            />
            <Text style={styles.priceDash}>—</Text>
            <TextInput
              style={[styles.filterInput, styles.priceInput]}
              value={priceMax}
              onChangeText={setPriceMax}
              placeholder="До"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetBtnText}>Сбросить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Применить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 10 },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  searchBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
  categoriesWrap: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
    alignSelf: "flex-start",
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 13, color: COLORS.muted },
  catTextActive: { color: COLORS.white, fontWeight: "600" },
  list: { padding: 16, paddingBottom: 120 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.muted },
  loadMore: {
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  loadMoreText: { color: COLORS.primary, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 80 : 90,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  // Filter modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  filterSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  filterTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 14,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceInput: { flex: 1 },
  priceDash: { fontSize: 16, color: COLORS.muted },
  filterActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  resetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  resetBtnText: { fontWeight: "600", color: COLORS.text, fontSize: 15 },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  applyBtnText: { fontWeight: "700", color: COLORS.white, fontSize: 15 },
});
