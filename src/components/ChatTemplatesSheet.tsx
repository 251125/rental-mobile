import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import {
  ChatTemplate,
  useChatTemplates,
  useCreateChatTemplate,
  useDeleteChatTemplate,
  useUpdateChatTemplate,
} from "@/hooks/use-chat-templates";
import { useT } from "@/i18n/useT";

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (text: string) => void;
}

export default function ChatTemplatesSheet({ visible, onClose, onPick }: Props) {
  const t = useT();
  const [manage, setManage] = useState(false);
  const { data: templates = [], isLoading } = useChatTemplates(visible);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("Chat.templates")}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={() => setManage((v) => !v)}>
                <Ionicons
                  name={manage ? "close-outline" : "settings-outline"}
                  size={22}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ margin: 24 }} />
          ) : manage ? (
            <ManageList templates={templates} />
          ) : (
            <PickList
              templates={templates}
              onPick={(text) => {
                onPick(text);
                onClose();
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function PickList({
  templates,
  onPick,
}: {
  templates: ChatTemplate[];
  onPick: (text: string) => void;
}) {
  const t = useT();
  if (templates.length === 0) {
    return (
      <Text style={styles.empty}>{t("Chat.templatesEmpty")}</Text>
    );
  }
  return (
    <ScrollView style={{ maxHeight: 400 }}>
      {templates.map((tpl) => (
        <TouchableOpacity
          key={tpl.id}
          style={styles.row}
          onPress={() => onPick(tpl.text)}
        >
          <Text style={styles.rowText}>{tpl.text}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function ManageList({ templates }: { templates: ChatTemplate[] }) {
  const t = useT();
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { mutate: create, isPending: isCreating } = useCreateChatTemplate();
  const { mutate: update } = useUpdateChatTemplate();
  const { mutate: del } = useDeleteChatTemplate();

  return (
    <View>
      <View style={styles.newRow}>
        <TextInput
          value={newText}
          onChangeText={setNewText}
          placeholder={t("Chat.templatesNewPlaceholder")}
          placeholderTextColor={COLORS.muted}
          maxLength={500}
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.addBtn, (!newText.trim() || isCreating) && { opacity: 0.5 }]}
          disabled={!newText.trim() || isCreating}
          onPress={() => {
            create(newText.trim(), { onSuccess: () => setNewText("") });
          }}
        >
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ maxHeight: 360 }}>
        {templates.map((tpl) => (
          <View key={tpl.id} style={styles.manageRow}>
            {editingId === tpl.id ? (
              <>
                <TextInput
                  value={editText}
                  onChangeText={setEditText}
                  maxLength={500}
                  autoFocus
                  style={[styles.input, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (editText.trim()) {
                      update({ id: tpl.id, text: editText.trim() });
                      setEditingId(null);
                    }
                  }}
                >
                  <Ionicons name="checkmark" size={22} color={COLORS.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingId(null)}>
                  <Ionicons name="close" size={22} color={COLORS.muted} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.rowText, { flex: 1 }]} numberOfLines={2}>
                  {tpl.text}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(tpl.id);
                    setEditText(tpl.text);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => del(tpl.id)}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  empty: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    paddingVertical: 32,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  newRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 8,
  },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});
