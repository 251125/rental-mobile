import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from "react-native";
import { confirm } from "@/lib/confirm";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS } from "@/constants";
import { router } from "expo-router";
import { useT } from "@/i18n/useT";

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

interface AdminListing {
  id: string;
  title: string;
  city: string;
  price: number;
  views_count: number;
  owner: { id: string; name: string };
  category: { id: string; name: string };
  created_at: string;
}

interface Report {
  id: string;
  type: "USER" | "LISTING" | "RENTAL";
  target_id: string;
  reason: string;
  description: string | null;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
  created_at: string;
  reporter: { id: string; name: string };
}


export default function AdminScreen() {
  const t = useT();
  const REPORT_REASON_LABEL: Record<string, string> = {
    SPAM: t("Admin.reasonSpam"),
    FRAUD: t("Admin.reasonFraud"),
    INAPPROPRIATE: t("Admin.reasonInappropriate"),
    DAMAGE: t("Admin.reasonDamage"),
    OTHER: t("Admin.reasonOther"),
  };
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "stats" | "users" | "listings" | "categories" | "reports"
  >("stats");
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

  const { data: adminListings, isLoading: listingsLoading } = useQuery<{
    data: AdminListing[];
    meta: { total: number };
  }>({
    queryKey: ["admin", "listings"],
    queryFn: () => api.get("/listings?limit=50").then((r) => r.data),
    enabled: user?.role === "ADMIN" && activeTab === "listings",
  });

  const { mutate: deleteListing } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/listings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "listings"] }),
  });

  const [reportsFilter, setReportsFilter] = useState<"PENDING" | "ALL">("PENDING");
  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["admin", "reports"],
    queryFn: () => api.get("/reports").then((r) => r.data),
    enabled: user?.role === "ADMIN" && activeTab === "reports",
  });

  const { mutate: updateReport } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/reports/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
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

  const pendingReports = (reports ?? []).filter((r) => r.status === "PENDING").length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.topBtn, styles.financeBtn]}
          onPress={() => router.push("/admin/finance" as never)}
        >
          <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
          <Text style={styles.topBtnText}>Финансы</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topBtn, styles.disputesShortcut]}
          onPress={() => router.push("/admin/disputes" as never)}
        >
          <Ionicons name="shield-half-outline" size={18} color={COLORS.warning} />
          <Text style={styles.topBtnText}>Споры</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(["stats", "users", "listings", "categories", "reports"] as const).map(
          (tab) => {
            const label =
              tab === "stats"
                ? t("Admin.tabStats")
                : tab === "users"
                  ? t("Admin.tabUsers")
                  : tab === "listings"
                    ? t("Admin.tabListings")
                    : tab === "categories"
                      ? t("Admin.tabCategories")
                      : t("Admin.tabReports");
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
                >
                  {label}
                </Text>
                {tab === "reports" && pendingReports > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{pendingReports}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          },
        )}
      </View>

      {activeTab === "stats" && (
        statsLoading ? <LoadingSpinner /> : (
          <View style={styles.statsGrid}>
            {[
              { label: t("Admin.statsUsers"), value: stats?.total_users, icon: "people-outline" },
              { label: t("Admin.statsListings"), value: stats?.total_listings, icon: "list-outline" },
              { label: t("Admin.statsRentals"), value: stats?.total_rentals, icon: "car-outline" },
              { label: t("Admin.statsRevenue"), value: stats?.total_revenue, icon: "cash-outline" },
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
                      confirm({
                        title: t("Admin.deleteUser"),
                        message: item.name,
                        cancelText: t("Common.cancel"),
                        confirmText: t("Profile.deleteShort"),
                        destructive: true,
                        onConfirm: () => deleteUser(item.id),
                      })
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

      {activeTab === "listings" && (
        listingsLoading ? <LoadingSpinner /> : (
          <FlatList
            data={adminListings?.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.userEmail}>
                    {item.city} • {Number(item.price).toLocaleString()} ₸/день
                  </Text>
                  <Text style={styles.userRole}>
                    {item.owner.name} • {item.views_count} просм.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/listings/${item.id}` as never)}
                  style={{ paddingRight: 12 }}
                >
                  <Ionicons name="open-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    confirm({
                      title: t("Admin.deleteListing"),
                      message: item.title,
                      cancelText: t("Common.cancel"),
                      confirmText: t("Profile.deleteShort"),
                      destructive: true,
                      onConfirm: () => deleteListing(item.id),
                    })
                  }
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Объявлений нет</Text>
            }
          />
        )
      )}

      {activeTab === "reports" && (
        reportsLoading ? <LoadingSpinner /> : (
          <FlatList
            data={(reports ?? []).filter((r) =>
              reportsFilter === "PENDING" ? r.status === "PENDING" : true,
            )}
            keyExtractor={(r) => r.id}
            ListHeaderComponent={
              <View style={styles.reportsFilterRow}>
                {(["PENDING", "ALL"] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setReportsFilter(f)}
                    style={[
                      styles.reportsFilter,
                      reportsFilter === f && styles.reportsFilterActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reportsFilterText,
                        reportsFilter === f && styles.reportsFilterTextActive,
                      ]}
                    >
                      {f === "PENDING" ? t("Admin.reportsActive") : t("Admin.reportsAll")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportType}>
                    {item.type === "USER"
                      ? t("Admin.reportTypeUser")
                      : item.type === "LISTING"
                        ? t("Admin.reportTypeListing")
                        : t("Admin.reportTypeRental")}
                  </Text>
                  <View
                    style={[
                      styles.reportStatusBadge,
                      item.status === "PENDING"
                        ? { backgroundColor: "#fff7ed", borderColor: "#fed7aa" }
                        : item.status === "RESOLVED"
                          ? { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }
                          : { backgroundColor: COLORS.background, borderColor: COLORS.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reportStatusText,
                        item.status === "PENDING"
                          ? { color: COLORS.warning }
                          : item.status === "RESOLVED"
                            ? { color: COLORS.success }
                            : { color: COLORS.muted },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reportReason}>
                  {REPORT_REASON_LABEL[item.reason] ?? item.reason}
                </Text>
                {item.description ? (
                  <Text style={styles.reportDesc}>{item.description}</Text>
                ) : null}
                <Text style={styles.reportMeta}>
                  От {item.reporter?.name} • {new Date(item.created_at).toLocaleString("ru-RU")}
                </Text>
                <View style={styles.reportActions}>
                  <TouchableOpacity
                    onPress={() => {
                      const path =
                        item.type === "USER"
                          ? `/profile/${item.target_id}`
                          : item.type === "LISTING"
                            ? `/listings/${item.target_id}`
                            : "/rentals/my";
                      router.push(path as never);
                    }}
                    style={styles.reportLinkBtn}
                  >
                    <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.reportLinkText}>Открыть</Text>
                  </TouchableOpacity>
                  {item.status === "PENDING" && (
                    <>
                      <TouchableOpacity
                        style={styles.reportResolveBtn}
                        onPress={() =>
                          updateReport({ id: item.id, status: "RESOLVED" })
                        }
                      >
                        <Text style={styles.reportResolveText}>Решено</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.reportRejectBtn}
                        onPress={() =>
                          updateReport({ id: item.id, status: "REJECTED" })
                        }
                      >
                        <Text style={styles.reportRejectText}>Отклонить</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Жалоб нет</Text>
            }
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
              placeholder={t("Admin.categoryNamePlaceholder")}
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
                      confirm({
                        title: t("Admin.deleteCategory"),
                        message: item.name,
                        cancelText: t("Common.cancel"),
                        confirmText: t("Profile.deleteShort"),
                        destructive: true,
                        onConfirm: () => deleteCategory(item.id),
                      })
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
    paddingHorizontal: 4,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    position: "relative",
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
  topRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  financeBtn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  disputesShortcut: { borderColor: COLORS.warning, backgroundColor: "#fff7ed" },
  topBtnText: { color: COLORS.text, fontWeight: "700" },
  tabBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    paddingHorizontal: 4,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    paddingVertical: 40,
  },
  reportsFilterRow: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
  },
  reportsFilter: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  reportsFilterActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  reportsFilterText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  reportsFilterTextActive: { color: COLORS.white },
  reportCard: {
    marginHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  reportHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reportType: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  reportStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  reportStatusText: { fontSize: 11, fontWeight: "700" },
  reportReason: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  reportDesc: { fontSize: 12, color: COLORS.textSecondary },
  reportMeta: { fontSize: 11, color: COLORS.muted },
  reportActions: { flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" },
  reportLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportLinkText: { color: COLORS.primary, fontWeight: "600", fontSize: 12 },
  reportResolveBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportResolveText: { color: COLORS.white, fontWeight: "600", fontSize: 12 },
  reportRejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  reportRejectText: { color: COLORS.danger, fontWeight: "600", fontSize: 12 },
});
