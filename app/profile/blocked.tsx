import React, { useEffect } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS } from "@/constants";
import { useBlockedUsers, useUnblockUser } from "@/hooks/use-blocks";
import { useT } from "@/i18n/useT";
import UserAvatar from "@/components/UserAvatar";

export default function BlockedUsersScreen() {
  const t = useT();
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

  const { data, isLoading } = useBlockedUsers();
  const { mutate: unblock, isPending } = useUnblockUser();

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={data ?? []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          return (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.userBlock}
                onPress={() => router.push(`/profile/${item.blocked.id}` as never)}
              >
                <UserAvatar url={item.blocked.avatar_url} name={item.blocked.name} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.blocked.name}</Text>
                  <Text style={styles.since}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unblockBtn}
                onPress={() => unblock(item.blocked.id)}
                disabled={isPending}
              >
                <Ionicons name="shield-outline" size={14} color={COLORS.warning} />
                <Text style={styles.unblockText}>{t("Profile.unblockShort")}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="ban-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>{t("Profile.blockedEmpty")}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
  },
  userBlock: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  since: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  unblockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
    backgroundColor: "#fff7ed",
  },
  unblockText: { color: COLORS.warning, fontWeight: "600", fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.muted },
});
