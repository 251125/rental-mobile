import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { useIncomingRentalsCount } from "@/hooks/use-rentals";
import { COLORS, resolveImageUrl } from "@/constants";
import { useT } from "@/i18n/useT";

export default function ProfileScreen() {
  const t = useT();
  const { user } = useAuthStore();
  const { mutate: logout, isPending } = useLogout();
  const { data: incomingCount = 0 } = useIncomingRentalsCount();

  const avatarUri = user?.avatar_url ? resolveImageUrl(user.avatar_url) ?? "" : null;

  type IoniconsName =
    | "person-outline"
    | "list-outline"
    | "time-outline"
    | "mail-outline"
    | "shield-outline"
    | "lock-closed-outline"
    | "qr-code-outline"
    | "warning-outline"
    | "ban-outline"
    | "information-circle-outline"
    | "language-outline";

  const menuItems: { icon: IoniconsName; label: string; onPress: () => void; key?: string }[] = [
    {
      icon: "person-outline",
      label: t("Profile.edit"),
      onPress: () => router.push("/profile/edit" as any),
    },
    {
      icon: "lock-closed-outline",
      label: t("Profile.changePassword"),
      onPress: () => router.push("/profile/change-password" as any),
    },
    {
      icon: "language-outline",
      label: t("Nav.language"),
      onPress: () => router.push("/profile/language" as any),
    },
    {
      icon: "list-outline",
      label: t("Nav.myListings"),
      onPress: () => router.push("/profile/my-listings" as any),
    },
    {
      icon: "time-outline",
      label: t("Nav.myRentals"),
      onPress: () => router.push("/rentals/my" as any),
    },
    {
      icon: "mail-outline",
      key: "incoming",
      label: t("Nav.incoming"),
      onPress: () => router.push("/rentals/incoming" as any),
    },
    {
      icon: "warning-outline",
      label: t("Nav.disputes"),
      onPress: () => router.push("/disputes" as any),
    },
    {
      icon: "ban-outline",
      label: t("Nav.blocked"),
      onPress: () => router.push("/profile/blocked" as any),
    },
    {
      icon: "information-circle-outline",
      label: t("Nav.about"),
      onPress: () => router.push("/about" as any),
    },
  ];

  if (user?.role === "ADMIN") {
    menuItems.push({
      icon: "shield-outline",
      label: t("Nav.admin"),
      onPress: () => router.push("/admin" as any),
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("Profile.title")}</Text>
      </View>
      <ScrollView>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.rating_avg && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.rating}>{parseFloat(user.rating_avg).toFixed(1)}</Text>
              <Text style={styles.reviewsCount}>
                ({user.reviews_count})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => {
            const showBadge = item.key === "incoming" && incomingCount > 0;
            return (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                {showBadge && (
                  <View style={styles.incomingBadge}>
                    <Text style={styles.incomingBadgeText}>{incomingCount}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => logout()}
          disabled={isPending}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>
            {isPending ? t("Common.loading") : t("Nav.logout")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  profileCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
  },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  email: { fontSize: 13, color: COLORS.muted, marginBottom: 8 },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  reviewsCount: { fontSize: 12, color: COLORS.muted },
  menu: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  incomingBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    marginRight: 4,
  },
  incomingBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "700", textAlign: "center" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fee2e2",
    marginBottom: 32,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: COLORS.danger },
});
