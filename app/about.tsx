import React, { useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useCategories } from "@/hooks/use-listings";
import { COLORS } from "@/constants";
import api from "@/services/api";

interface Stats {
  listings: number;
  users: number;
}

const HOW_IT_WORKS = [
  {
    icon: "search-outline" as const,
    step: "01",
    title: "Найди нужное",
    desc: "Ищи по категориям, городу и цене.",
  },
  {
    icon: "people-outline" as const,
    step: "02",
    title: "Договорись",
    desc: "Отправь заявку, владелец одобрит и согласуете условия.",
  },
  {
    icon: "checkmark-circle-outline" as const,
    step: "03",
    title: "Пользуйся",
    desc: "Забери вещь, верни и оставь отзыв.",
  },
];

const PROS = [
  {
    icon: "shield-checkmark-outline" as const,
    title: "Безопасность",
    desc: "Все сделки защищены. Залог гарантирует возврат вещи.",
  },
  {
    icon: "star-outline" as const,
    title: "Рейтинги",
    desc: "Отзывы помогают выбрать надёжного партнёра.",
  },
  {
    icon: "flash-outline" as const,
    title: "Быстро",
    desc: "Создай объявление за пару минут и зарабатывай.",
  },
  {
    icon: "people-circle-outline" as const,
    title: "Сообщество",
    desc: "Тысячи пользователей по всему Казахстану.",
  },
];

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Cars: "car-outline",
  Bicycles: "bicycle-outline",
  Cameras: "camera-outline",
  "Camping Gear": "trail-sign-outline",
  "Power Tools": "construct-outline",
  "Gaming Consoles": "game-controller-outline",
};

export default function AboutScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const { isAuthenticated } = useAuthStore();
  const { data: categories } = useCategories();
  const { data: stats } = useQuery<Stats>({
    queryKey: ["stats", "public"],
    queryFn: async () => {
      const listings = await api
        .get<{ meta: { total: number } }>("/listings?limit=1")
        .then((r) => r.data.meta.total);
      return { listings, users: 0 };
    },
  });

  const popular = (categories ?? []).slice(0, 6);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Арендуй что угодно,{"\n"}когда угодно
          </Text>
          <Text style={styles.heroSubtitle}>
            Платформа для аренды вещей между людьми. Найди нужное рядом или
            сдай своё и зарабатывай.
          </Text>
          <View style={styles.heroBtns}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/" as never)}
            >
              <Text style={styles.primaryBtnText}>Смотреть объявления</Text>
            </TouchableOpacity>
            {!isAuthenticated && (
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => router.push("/auth/register" as never)}
              >
                <Text style={styles.outlineBtnText}>Регистрация</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem icon="cube-outline" value={`${stats?.listings ?? "…"}`} label="Объявлений" />
          <StatItem icon="star-outline" value="4.8" label="Рейтинг" />
          <StatItem icon="time-outline" value="24/7" label="Поддержка" />
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>Как это работает</Text>
        <View style={styles.col}>
          {HOW_IT_WORKS.map((step) => (
            <View key={step.step} style={styles.howCard}>
              <View style={styles.howIcon}>
                <Ionicons name={step.icon} size={26} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.howHeader}>
                  <Text style={styles.howTitle}>{step.title}</Text>
                  <Text style={styles.howStep}>{step.step}</Text>
                </View>
                <Text style={styles.howDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Why us */}
        <Text style={styles.sectionTitle}>Почему Rental?</Text>
        <View style={styles.grid2}>
          {PROS.map((p) => (
            <View key={p.title} style={styles.proCard}>
              <View style={styles.proIcon}>
                <Ionicons name={p.icon} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.proTitle}>{p.title}</Text>
              <Text style={styles.proDesc}>{p.desc}</Text>
            </View>
          ))}
        </View>

        {/* Categories */}
        {popular.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Популярные категории</Text>
            <View style={styles.grid2}>
              {popular.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.catCard}
                  onPress={() => router.push("/" as never)}
                >
                  <View style={styles.catIcon}>
                    <Ionicons
                      name={CATEGORY_ICON[c.name] ?? "cube-outline"}
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.catName}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* CTA */}
        {!isAuthenticated && (
          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>Готов начать?</Text>
            <Text style={styles.ctaText}>
              Зарегистрируйся бесплатно и начни арендовать или сдавать вещи.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push("/auth/register" as never)}
            >
              <Text style={styles.ctaBtnText}>Зарегистрироваться</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 32, gap: 20 },
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 22,
    gap: 12,
  },
  heroTitle: { color: COLORS.white, fontSize: 22, fontWeight: "800", lineHeight: 28 },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18 },
  heroBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
  primaryBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  outlineBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10 },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.muted, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginTop: 8 },
  col: { gap: 10 },
  howCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
  },
  howIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  howHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  howTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  howStep: { fontSize: 22, fontWeight: "800", color: "#dbeafe" },
  howDesc: { fontSize: 12, color: COLORS.muted, marginTop: 4, lineHeight: 17 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  proCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  proIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  proTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  proDesc: { fontSize: 12, color: COLORS.muted, lineHeight: 16 },
  catCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  catName: { fontSize: 13, fontWeight: "600", color: COLORS.text, flex: 1 },
  cta: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    gap: 10,
  },
  ctaTitle: { color: COLORS.white, fontSize: 20, fontWeight: "800" },
  ctaText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  ctaBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  ctaBtnText: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
});
