import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMyChats } from "@/hooks/use-chats";
import { useAuthStore } from "@/store/auth.store";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS, API_URL } from "@/constants";
import { Chat } from "@/types";

export default function ChatsScreen() {
  const { user } = useAuthStore();
  const { data: chats, isLoading } = useMyChats(true);

  const getOtherParticipant = (chat: Chat) => {
    if (!user) return chat.participant1;
    return chat.participant1_id === user.id
      ? chat.participant2
      : chat.participant1;
  };

  const getLastMessage = (chat: Chat) => {
    const msgs = chat.messages;
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Чаты</Text>
      </View>
      <FlatList
        data={chats ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const other = getOtherParticipant(item);
          const last = getLastMessage(item);
          const avatarUri = other.avatar_url
            ? `${API_URL}${other.avatar_url}`
            : null;
          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => router.push(`/chats/${item.id}`)}
            >
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarLetter}>
                      {other.name[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{other.name}</Text>
                {last && (
                  <Text style={styles.lastMsg} numberOfLines={1}>
                    {last.sender_id === user?.id ? "Вы: " : ""}
                    {last.content}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={COLORS.border}
            />
            <Text style={styles.emptyText}>Чатов пока нет</Text>
            <Text style={styles.emptyHint}>
              Напишите владельцу объявления, чтобы начать чат
            </Text>
          </View>
        }
      />
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
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  avatarWrap: {},
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  lastMsg: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 76 },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyText: { fontSize: 16, fontWeight: "600", color: COLORS.muted },
  emptyHint: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
  },
});
