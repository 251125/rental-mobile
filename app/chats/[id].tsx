import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChatMessages, useMyChats } from "@/hooks/use-chats";
import { useAuthStore } from "@/store/auth.store";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS } from "@/constants";
import { Message } from "@/types";
import { useCall } from "@/providers/CallProvider";
import { useT } from "@/i18n/useT";
import ChatTemplatesSheet from "@/components/ChatTemplatesSheet";

export default function ChatScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, isLoading, sendMessage } = useChatMessages(id);
  const { user } = useAuthStore();
  const { data: chats } = useMyChats(!!user);
  const { callState, initiateCall, initiateVideoCall } = useCall();

  const chat = chats?.find((c) => c.id === id);
  const other = chat && user
    ? chat.participant1_id === user.id ? chat.participant2 : chat.participant1
    : null;
  const [text, setText] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const listRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  // Show the other participant's name in the header instead of just "Чат"
  useEffect(() => {
    if (other?.name) {
      navigation.setOptions({ title: other.name });
    }
  }, [other?.name, navigation]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await sendMessage(trimmed);
  };

  if (isLoading) return <LoadingSpinner />;

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === "call") {
      let data: { outcome: string; duration?: number } = { outcome: "completed" };
      try { data = JSON.parse(item.content); } catch {}
      const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      const label =
        data.outcome === "completed" ? `${t("Chat.callShort")} ${fmt(data.duration ?? 0)}`
        : data.outcome === "rejected" ? t("Chat.callRejected")
        : t("Chat.callMissed");
      const icon = data.outcome === "completed" ? "📞" : "📵";
      return (
        <View style={styles.callMsgRow}>
          <Text style={styles.callMsgText}>{icon} {label}</Text>
        </View>
      );
    }
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
            {new Date(item.created_at).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {other && (
        <View style={styles.callBar}>
          <Text style={styles.callBarName}>{other.name}</Text>
          <TouchableOpacity
            style={[styles.callBtn, callState.status !== "idle" && styles.callBtnDisabled]}
            disabled={callState.status !== "idle"}
            onPress={() => initiateCall(other.id, other.name, other.avatar_url ?? undefined)}
          >
            <Ionicons name="call" size={20} color={callState.status === "idle" ? "#22c55e" : COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.callBtn, styles.videocallBtn, callState.status !== "idle" && styles.callBtnDisabled]}
            disabled={callState.status !== "idle"}
            onPress={() => initiateVideoCall(other.id, other.name, other.avatar_url ?? undefined)}
          >
            <Ionicons name="videocam" size={20} color={callState.status === "idle" ? "#2563eb" : COLORS.muted} />
          </TouchableOpacity>
        </View>
      )}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t("Chat.startConversation")}</Text>
            </View>
          }
        />
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.templatesBtn}
            onPress={() => setTemplatesOpen(true)}
          >
            <Ionicons name="list-outline" size={22} color={COLORS.muted} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t("Chat.messagePlaceholder")}
            placeholderTextColor={COLORS.muted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <ChatTemplatesSheet
          visible={templatesOpen}
          onClose={() => setTemplatesOpen(false)}
          onPick={(tpl) => setText((cur) => (cur ? `${cur} ${tpl}` : tpl))}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  list: { padding: 16, flexGrow: 1 },
  msgRow: { marginBottom: 8, flexDirection: "row" },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: COLORS.white },
  msgTextOther: { color: COLORS.text },
  msgTime: { fontSize: 10, marginTop: 4 },
  msgTimeMe: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  msgTimeOther: { color: COLORS.muted },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 120,
    backgroundColor: COLORS.background,
  },
  templatesBtn: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  callMsgRow: { alignItems: "center", marginVertical: 6 },
  callMsgText: { fontSize: 12, color: COLORS.muted, backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, color: COLORS.muted },
  callBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  callBarName: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  videocallBtn: {
    backgroundColor: "#eff6ff",
  },
  callBtnDisabled: { backgroundColor: COLORS.background },
});
