import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  useMyListings,
  useDeleteListing,
  useSetListingVisibility,
} from "@/hooks/use-listings";
import ListingCard from "@/components/ListingCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS } from "@/constants";

export default function MyListingsScreen() {
  const { data, isLoading } = useMyListings();
  const { mutate: deleteListing } = useDeleteListing();
  const { mutate: setVisibility } = useSetListingVisibility();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <View style={{ position: "relative" }}>
              <ListingCard listing={item} />
              {item.is_hidden && (
                <View style={styles.hiddenBadge}>
                  <Ionicons name="eye-off-outline" size={12} color={COLORS.white} />
                  <Text style={styles.hiddenBadgeText}>Скрыто</Text>
                </View>
              )}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.visibilityBtn}
                disabled={togglingId === item.id}
                onPress={() => {
                  setTogglingId(item.id);
                  setVisibility(
                    { id: item.id, hidden: !item.is_hidden },
                    {
                      onSuccess: () => {
                        Toast.show({
                          type: "success",
                          text1: item.is_hidden
                            ? "Объявление снова в каталоге"
                            : "Объявление скрыто",
                        });
                        setTogglingId(null);
                      },
                      onError: (e: Error) => {
                        Toast.show({
                          type: "error",
                          text1: e.message ?? "Ошибка",
                        });
                        setTogglingId(null);
                      },
                    },
                  );
                }}
              >
                <Ionicons
                  name={item.is_hidden ? "eye-off-outline" : "eye-outline"}
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.editText}>
                  {item.is_hidden ? "Показать" : "Скрыть"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push(`/listings/edit/${item.id}`)}
              >
                <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
                <Text style={styles.editText}>Редактировать</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() =>
                  Alert.alert("Удалить?", "Объявление будет удалено.", [
                    { text: "Отмена", style: "cancel" },
                    {
                      text: "Удалить",
                      style: "destructive",
                      onPress: () => deleteListing(item.id),
                    },
                  ])
                }
              >
                <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                <Text style={styles.deleteText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="list-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Объявлений нет</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push("/listings/create")}
            >
              <Text style={styles.createBtnText}>Создать объявление</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  itemActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  visibilityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  hiddenBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(217, 119, 6, 0.95)",
  },
  hiddenBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  editText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteText: { fontSize: 12, color: COLORS.danger, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 16 },
  emptyText: { fontSize: 15, color: COLORS.muted },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
});
