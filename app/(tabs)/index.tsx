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

  const toggleFavorite = (listingId: string) => {
    if (favoriteIds.has(listingId)) {
      removeFav(listingId);
    } else {
      addFav(listingId);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Diplom Rental</Text>
        {user?.role === "ADMIN" && (
          <TouchableOpacity onPress={() => router.push("/admin")}>
            <Ionicons name="shield-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

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
      </View>

      {categories && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
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
      )}

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
                onPress={() =>
                  setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
                }
              >
                <Text style={styles.loadMoreText}>Загрузить ещё</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/listings/create")}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 10,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  searchBtnText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 14,
  },
  categories: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  catTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  list: {
    padding: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
  },
  loadMore: {
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  loadMoreText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 90,
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
});
