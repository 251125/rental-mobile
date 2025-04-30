import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS } from "@/constants";
import { router } from "expo-router";

interface AdminStats {
  total_users: number;
  total_listings: number;
  total_rentals: number;
  total_revenue: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AdminCategory {
  id: string;
  name: string;
  _count?: { listings: number };
}

export default function AdminScreen() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "categories">("stats");
  const [newCatName, setNewCatName] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get("/admin/stats").then((r) => r.data),
    enabled: user?.role === "ADMIN",
  });

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/admin/users").then((r) => r.data),
    enabled: user?.role === "ADMIN" && activeTab === "users",
  });

  const { data: categories, isLoading: catsLoading } = useQuery<AdminCategory[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
    enabled: activeTab === "categories",
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const { mutate: createCategory, isPending: isCreatingCat } = useMutation({
    mutationFn: (name: string) =>
      api.post("/categories", { name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setNewCatName("");
    },
  });

  const { mutate: deleteCategory } = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  if (user?.role !== "ADMIN") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.border} />
          <Text style={styles.deniedText}>Доступ запрещён</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.tabs}>
        {(["stats", "users", "categories"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "stats" ? "Статистика" : tab === "users" ? "Пользователи" : "Категории"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "stats" && (
        statsLoading ? <LoadingSpinner /> : (
          <View style={styles.statsGrid}>
            {[
              { label: "Пользователей", value: stats?.total_users, icon: "people-outline" },
              { label: "Объявлений", value: stats?.total_listings, icon: "list-outline" },
              { label: "Аренд", value: stats?.total_rentals, icon: "car-outline" },
              { label: "Выручка (₸)", value: stats?.total_revenue, icon: "cash-outline" },
            ].map((item) => (
              <View key={item.label} style={styles.statCard}>
                <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
                <Text style={styles.statValue}>{item.value ?? 0}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )
      )}

      {activeTab === "users" && (
        usersLoading ? <LoadingSpinner /> : (
          <FlatList
            data={users ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <Text style={styles.userRole}>{item.role}</Text>
                </View>
                {item.id !== user?.id && item.role !== "ADMIN" && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Удалить пользователя?", item.name, [
                        { text: "Отмена", style: "cancel" },
                        {
                          text: "Удалить",
                          style: "destructive",
                          onPress: () => deleteUser(item.id),
                        },
                      ])
                    }
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            contentContainerStyle={styles.listContent}
          />
        )
      )}

      {activeTab === "categories" && (
        <View style={styles.flex}>
          <View style={styles.addCatRow}>
            <TextInput
              style={styles.catInput}
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="Название категории"
              placeholderTextColor={COLORS.muted}
            />
            <TouchableOpacity
              style={[styles.addCatBtn, isCreatingCat && { opacity: 0.6 }]}
              onPress={() => newCatName.trim() && createCategory(newCatName.trim())}
              disabled={isCreatingCat}
            >
              <Ionicons name="add" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          {catsLoading ? <LoadingSpinner /> : (
            <FlatList
              data={categories ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.catRow}>
                  <Text style={styles.catName}>{item.name}</Text>
                  <Text style={styles.catCount}>
                    {item._count?.listings ?? 0} объявл.
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Удалить категорию?", item.name, [
                        { text: "Отмена", style: "cancel" },
                        {
                          text: "Удалить",
                          style: "destructive",
                          onPress: () => deleteCategory(item.id),
                        },
                      ])
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.muted, fontWeight: "500" },
  tabTextActive: { color: COLORS.primary, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: "800", color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.muted, textAlign: "center" },
  listContent: { paddingBottom: 24 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.muted },
  userRole: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  addCatRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  catInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  addCatBtn: {
    backgroundColor: COLORS.primary,
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
  },
  catName: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: "500" },
  catCount: { fontSize: 12, color: COLORS.muted, marginRight: 12 },
  denied: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  deniedText: { fontSize: 16, color: COLORS.muted },
});
