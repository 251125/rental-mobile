import React, { useEffect } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { PlatformFinance, PlatformIncomeSource } from "@/types";

const SOURCE_LABEL: Record<PlatformIncomeSource, string> = {
  COMMISSION: "Комиссия",
  PROMOTION: "Продвижение",
  PREMIUM: "Premium",
};

const SOURCE_ICON: Record<PlatformIncomeSource, keyof typeof Ionicons.glyphMap> = {
  COMMISSION: "trending-up-outline",
  PROMOTION: "rocket-outline",
  PREMIUM: "diamond-outline",
};

const SOURCE_COLOR: Record<PlatformIncomeSource, string> = {
  COMMISSION: COLORS.primary,
  PROMOTION: COLORS.warning,
  PREMIUM: "#8b5cf6",
};

export default function AdminFinanceScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 4, padding: 4 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const { user } = useAuthStore();
  const { data, isLoading } = useQuery<PlatformFinance>({
    queryKey: ["admin", "finance"],
    queryFn: () => api.get("/admin/finance").then((r) => r.data),
    enabled: user?.role === "ADMIN",
  });

  if (!user || user.role !== "ADMIN") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.denied}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.border} />
          <Text style={styles.deniedText}>Доступ запрещён</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !data) return <LoadingSpinner />;

  const maxDay = Math.max(1, ...data.byDay.map((d) => d.total));

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={data.recent}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            {/* Total */}
            <View style={styles.totalCard}>
              <View>
                <Text style={styles.totalLabel}>Всего за всё время</Text>
                <Text style={styles.totalValue}>
                  {Number(data.total).toLocaleString()} ₸
                </Text>
              </View>
              <Ionicons name="trending-up" size={32} color="rgba(255,255,255,0.7)" />
            </View>

            {/* By source */}
            <View style={styles.sourcesRow}>
              {(Object.keys(SOURCE_LABEL) as PlatformIncomeSource[]).map((s) => (
                <View key={s} style={styles.sourceCard}>
                  <View
                    style={[
                      styles.sourceIcon,
                      { backgroundColor: SOURCE_COLOR[s] + "20" },
                    ]}
                  >
                    <Ionicons
                      name={SOURCE_ICON[s]}
                      size={16}
                      color={SOURCE_COLOR[s]}
                    />
                  </View>
                  <Text style={styles.sourceTitle}>{SOURCE_LABEL[s]}</Text>
                  <Text style={styles.sourceValue}>
                    {Number(data.totals[s] ?? 0).toLocaleString()} ₸
                  </Text>
                  <Text style={styles.sourceCount}>
                    {data.counts[s] ?? 0} опер.
                  </Text>
                </View>
              ))}
            </View>

            {/* Active counts */}
            <View style={styles.activeRow}>
              <View style={styles.activeCard}>
                <Ionicons name="diamond" size={22} color="#8b5cf6" />
                <View>
                  <Text style={styles.activeLabel}>Активных Premium</Text>
                  <Text style={styles.activeValue}>{data.activePremium}</Text>
                </View>
              </View>
              <View style={styles.activeCard}>
                <Ionicons name="rocket" size={22} color={COLORS.warning} />
                <View>
                  <Text style={styles.activeLabel}>Продвинутых</Text>
                  <Text style={styles.activeValue}>{data.activePromoted}</Text>
                </View>
              </View>
            </View>

            {/* Daily bars */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Доход за последние 30 дней</Text>
              <View style={styles.chartRow}>
                {data.byDay.map((d) => {
                  const h = Math.max(2, (d.total / maxDay) * 80);
                  return (
                    <View key={d.date} style={styles.barCol}>
                      <View
                        style={[
                          styles.bar,
                          { height: h, opacity: d.total > 0 ? 1 : 0.3 },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartAxis}>
                <Text style={styles.chartAxisText}>
                  {new Date(data.byDay[0]?.date ?? Date.now()).toLocaleDateString(
                    "ru-RU",
                    { day: "2-digit", month: "2-digit" },
                  )}
                </Text>
                <Text style={styles.chartAxisText}>
                  {new Date(
                    data.byDay[data.byDay.length - 1]?.date ?? Date.now(),
                  ).toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </Text>
              </View>
            </View>

            <Text style={styles.recentTitle}>Последние операции</Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={styles.recentRow}>
            <View
              style={[
                styles.sourceIconSm,
                { backgroundColor: SOURCE_COLOR[r.source] + "20" },
              ]}
            >
              <Ionicons
                name={SOURCE_ICON[r.source]}
                size={14}
                color={SOURCE_COLOR[r.source]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentDesc} numberOfLines={1}>
                {r.description ?? SOURCE_LABEL[r.source]}
              </Text>
              <Text style={styles.recentDate}>
                {new Date(r.created_at).toLocaleString("ru-RU")}
              </Text>
            </View>
            <Text style={styles.recentAmount}>
              +{Number(r.amount).toLocaleString()} ₸
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Пока пусто</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 32 },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  totalValue: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 4 },
  sourcesRow: { flexDirection: "row", gap: 8 },
  sourceCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  sourceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  sourceTitle: { fontSize: 11, color: COLORS.muted, fontWeight: "600" },
  sourceValue: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  sourceCount: { fontSize: 10, color: COLORS.muted },
  activeRow: { flexDirection: "row", gap: 8 },
  activeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
  },
  activeLabel: { fontSize: 11, color: COLORS.muted },
  activeValue: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  chartCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14 },
  chartTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginBottom: 10 },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 90,
  },
  barCol: { flex: 1, alignItems: "stretch" },
  bar: { backgroundColor: COLORS.primary, borderRadius: 2 },
  chartAxis: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  chartAxisText: { fontSize: 10, color: COLORS.muted },
  recentTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 6 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 10,
  },
  sourceIconSm: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  recentDesc: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  recentDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  recentAmount: { color: COLORS.success, fontWeight: "700", fontSize: 13 },
  sep: { height: 8 },
  emptyText: { textAlign: "center", color: COLORS.muted, paddingVertical: 24 },
  denied: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  deniedText: { fontSize: 16, color: COLORS.muted },
});
