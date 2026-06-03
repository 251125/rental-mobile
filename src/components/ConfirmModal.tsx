import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { create } from "zustand";
import { COLORS } from "@/constants";

interface ConfirmRequest {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface ConfirmState {
  pending: ConfirmRequest | null;
  show: (req: ConfirmRequest) => void;
  hide: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  pending: null,
  show: (req) => set({ pending: req }),
  hide: () => set({ pending: null }),
}));

/**
 * Mounted once at the root layout. Renders a styled modal whenever
 * confirm() is called from anywhere in the app.
 */
export default function ConfirmHost() {
  const pending = useConfirmStore((s) => s.pending);
  const hide = useConfirmStore((s) => s.hide);

  if (!pending) return null;

  const onCancel = () => hide();
  const onOk = () => {
    pending.onConfirm();
    hide();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      {/* Tap backdrop to dismiss. Pressable used so the inner card doesn't
          inherit the press handler. */}
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{pending.title}</Text>
          {pending.message ? (
            <Text style={styles.message}>{pending.message}</Text>
          ) : null}
          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>
                {pending.cancelText ?? "Отмена"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.okBtn,
                pending.destructive && styles.okBtnDestructive,
              ]}
              onPress={onOk}
            >
              <Text style={styles.okText}>
                {pending.confirmText ?? "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingTop: 22,
    paddingBottom: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  okBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    minWidth: 90,
    alignItems: "center",
  },
  okBtnDestructive: {
    backgroundColor: COLORS.danger,
  },
  okText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
