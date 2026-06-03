import React, { useCallback, useState } from "react";
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
  ImageBackground,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useListings, useCategories } from "@/hooks/use-listings";
import { useMyFavorites, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useAuthStore } from "@/store/auth.store";
import { useCompareStore } from "@/store/compare.store";
import ListingCard from "@/components/ListingCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getSavedSearches,
  saveSearch,
  deleteSavedSearch,
  SavedSearch,
} from "@/lib/saved-searches";
import Toast from "react-native-toast-message";
import { COLORS } from "@/constants";
import { ListingFilters } from "@/types";
import CityPicker from "@/components/CityPicker";
import { useT } from "@/i18n/useT";

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroBanner({ search, onSearch, onChangeSearch }: {
  search: string;
  onSearch: () => void;
  onChangeSearch: (v: string) => void;
}) {
  const t = useT();
  return (
    <View style={hero.wrap}>
      <View style={hero.gradient}>
        <Text style={hero.tag}>{t("Home.heroBadge")}</Text>
        <Text style={hero.title}>{t("Home.heroTitle")}</Text>
        <Text style={hero.sub}>{t("Home.heroSub")}</Text>

        <View style={hero.searchRow}>
          <View style={hero.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={hero.searchInput}
              value={search}
              onChangeText={onChangeSearch}
              placeholder={t("Home.searchPlaceholder")}
              placeholderTextColor="#94a3b8"
              onSubmitEditing={onSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => onChangeSearch("")}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={hero.searchBtn} onPress={onSearch}>
            <Text style={hero.searchBtnText}>Найти</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 12, marginBottom: 8 },
  gradient: {
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    borderRadius: 20,
    overflow: "hidden",
  },
  tag: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    marginBottom: 6,
  },
  sub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  searchBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  searchBtnText: {
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: 14,
  },
});

// ─── Home screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const t = useT();
  const { user } = useAuthStore();
  const { items: compareItems } = useCompareStore();
  const [filters, setFilters] = useState<ListingFilters>({ page: 1, limit: 20, sortBy: "created_at", sortOrder: "desc" });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "price" | "rating_avg" | "views_count">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void getSavedSearches().then((list) => {
        if (alive) setSavedSearches(list);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const hasMeaningfulFilter =
    !!filters.search || !!filters.city || !!filters.price_min || !!filters.price_max;

  const handleSaveSearch = async () => {
    if (!hasMeaningfulFilter) {
      Toast.show({ type: "info", text1: t("Home.filtersFirst") });
      return;
    }
    const ok = await saveSearch(filters);
    if (ok) {
      Toast.show({ type: "success", text1: "Поиск сохранён" });
      setSavedSearches(await getSavedSearches());
    } else {
      Toast.show({ type: "info", text1: "Уже в сохранённых" });
    }
  };

  const applySaved = (s: SavedSearch) => {
    setFilters(s.filters);
    setSearch(s.filters.search ?? "");
    setSelectedCategory(s.filters.category_ids?.[0] ?? null);
    setCityInput(s.filters.city ?? "");
    setPriceMin(s.filters.price_min ? String(s.filters.price_min) : "");
    setPriceMax(s.filters.price_max ? String(s.filters.price_max) : "");
  };

  const removeSaved = async (id: string) => {
    await deleteSavedSearch(id);
    setSavedSearches(await getSavedSearches());
  };

  const activeFilterCount =
    (filters.city ? 1 : 0) +
    (filters.price_min ? 1 : 0) +
    (filters.price_max ? 1 : 0) +
    (filters.sortBy && filters.sortBy !== "created_at" ? 1 : 0);

  const { data, isLoading } = useListings(filters);
  const { data: categories } = useCategories();
  const { data: favorites } = useMyFavorites();
  const { mutate: addFav } = useAddFavorite();
  const { mutate: removeFav } = useRemoveFavorite();

  const favoriteIds = new Set(favorites?.map((f) => f.listing_id) ?? []);

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: search.trim() || undefined,
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
      sortBy,
      sortOrder,
      page: 1,
    }));
    setShowFilters(false);
  };

  const resetFilters = () => {
    setCityInput("");
    setPriceMin("");
    setPriceMax("");
    setSortBy("created_at");
    setSortOrder("desc");
    setFilters({ page: 1, limit: 20, sortBy: "created_at", sortOrder: "desc" });
    setShowFilters(false);
  };

  const SORT_OPTIONS: { label: string; sortBy: typeof sortBy; sortOrder: typeof sortOrder }[] = [
    { label: t("Home.sortNewest"), sortBy: "created_at", sortOrder: "desc" },
    { label: t("Home.sortOldest"), sortBy: "created_at", sortOrder: "asc" },
    { label: t("Home.sortPriceAsc"), sortBy: "price", sortOrder: "asc" },
    { label: t("Home.sortPriceDesc"), sortBy: "price", sortOrder: "desc" },
    { label: t("Home.sortRating"), sortBy: "rating_avg", sortOrder: "desc" },
    { label: t("Home.sortRating"), sortBy: "views_count", sortOrder: "desc" },
  ];

  const ListHeader = (
    <>
      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("Home.categories")}</Text>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFilterCount > 0 ? COLORS.white : COLORS.primary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
          <Text style={[styles.filterBtnText, activeFilterCount > 0 && { color: COLORS.white }]}>
            Фильтры
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
        style={styles.categoriesWrap}
      >
        <TouchableOpacity
          style={[styles.catChip, !selectedCategory && styles.catChipActive]}
          onPress={() => handleCategoryPress(null)}
        >
          <Text style={[styles.catText, !selectedCategory && styles.catTextActive]}>Все</Text>
        </TouchableOpacity>
        {categories?.map((cat) => (
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

      {savedSearches.length > 0 && (
        <View style={styles.savedWrap}>
          <Text style={styles.savedTitle}>Сохранённые поиски</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedRow}
          >
            {savedSearches.map((s) => (
              <View key={s.id} style={styles.savedChip}>
                <TouchableOpacity onPress={() => applySaved(s)}>
                  <Text numberOfLines={1} style={styles.savedChipText}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeSaved(s.id)} hitSlop={6}>
                  <Ionicons name="close-circle" size={14} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.listingHeader}>
        <Text style={styles.sectionTitle}>
          {data ? `${data.meta.total} объявлений` : "Объявления"}
        </Text>
        {hasMeaningfulFilter && (
          <TouchableOpacity onPress={handleSaveSearch} style={styles.saveBtn}>
            <Ionicons name="bookmark-outline" size={14} color={COLORS.primary} />
            <Text style={styles.saveBtnText}>Сохранить</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Rental</Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {user?.role === "ADMIN" && (
            <TouchableOpacity onPress={() => router.push("/admin")}>
              <Ionicons name="shield-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <>
          <HeroBanner search={search} onSearch={handleSearch} onChangeSearch={setSearch} />
          <LoadingSpinner />
        </>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              isFavorite={favoriteIds.has(item.id)}
              onFavoriteToggle={() =>
                favoriteIds.has(item.id) ? removeFav(item.id) : addFav(item.id)
              }
            />
          )}
          ListHeaderComponent={
            <>
              <HeroBanner search={search} onSearch={handleSearch} onChangeSearch={setSearch} />
              {ListHeader}
            </>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Объявления не найдены</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearch("");
                  setSelectedCategory(null);
                  setFilters({ page: 1, limit: 20 });
                }}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>Сбросить фильтры</Text>
              </TouchableOpacity>
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

      {/* FABs */}
      {compareItems.length > 0 && (
        <TouchableOpacity
          style={styles.compareFab}
          onPress={() => router.push("/compare" as never)}
        >
          <Ionicons name="git-compare-outline" size={22} color={COLORS.white} />
          <View style={styles.compareBadge}>
            <Text style={styles.compareBadgeText}>{compareItems.length}</Text>
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/listings/create")}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilters(false)} />
        <View style={styles.filterSheet}>
          <View style={styles.filterHandle} />
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Фильтры</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Город</Text>
          <CityPicker value={cityInput} onChange={setCityInput} placeholder={t("Home.anyCity")} />

          <Text style={styles.filterLabel}>Цена (₸/день)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.filterInput, styles.priceInput]}
              value={priceMin}
              onChangeText={setPriceMin}
              placeholder={t("Home.priceFrom")}
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
            />
            <Text style={styles.priceDash}>—</Text>
            <TextInput
              style={[styles.filterInput, styles.priceInput]}
              value={priceMax}
              onChangeText={setPriceMax}
              placeholder={t("Home.priceTo")}
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.filterLabel}>Сортировка</Text>
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortBy === opt.sortBy && sortOrder === opt.sortOrder;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.sortOption, isActive && styles.sortOptionActive]}
                  onPress={() => { setSortBy(opt.sortBy); setSortOrder(opt.sortOrder); }}
                >
                  <Text style={[styles.sortOptionText, isActive && styles.sortOptionTextActive]}>
                    {opt.label}
                  </Text>
                  {isActive && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: { fontSize: 20, fontWeight: "800", color: COLORS.primary },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    position: "relative",
  },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },

  categoriesWrap: { backgroundColor: COLORS.white },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 13, color: COLORS.muted },
  catTextActive: { color: COLORS.white, fontWeight: "600" },

  listingHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  saveBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },
  savedWrap: { paddingTop: 8, backgroundColor: COLORS.background },
  savedTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  savedRow: { paddingHorizontal: 16, gap: 8 },
  savedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 220,
  },
  savedChipText: { fontSize: 12, color: COLORS.text },

  list: { padding: 16, paddingBottom: 120 },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.muted },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: "600" },

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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  compareFab: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 80 : 90,
    right: 84,
    backgroundColor: "#7c3aed",
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  compareBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  compareBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },

  // Filter modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  filterSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  filterHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceInput: { flex: 1 },
  priceDash: { fontSize: 16, color: COLORS.muted },
  filterActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  resetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  resetBtnText: { fontWeight: "600", color: COLORS.text, fontSize: 15 },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  applyBtnText: { fontWeight: "700", color: COLORS.white, fontSize: 15 },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: COLORS.background,
  },
  sortOptionActive: { backgroundColor: "#dbeafe" },
  sortOptionText: { fontSize: 14, color: COLORS.text },
  sortOptionTextActive: { color: COLORS.primary, fontWeight: "600" },
});
