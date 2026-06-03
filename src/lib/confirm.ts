import { Alert, Platform } from "react-native";
import { useConfirmStore } from "@/components/ConfirmModal";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Cross-platform confirm dialog.
 * On native we use Alert.alert (works perfectly with action buttons).
 * On web we render our own ConfirmHost modal — react-native-web's Alert
 * doesn't reliably show action buttons, and window.confirm() looks ugly
 * and breaks immersion.
 */
export function confirm(opts: ConfirmOptions) {
  if (Platform.OS === "web") {
    useConfirmStore.getState().show(opts);
    return;
  }

  Alert.alert(opts.title, opts.message, [
    { text: opts.cancelText ?? "Cancel", style: "cancel" },
    {
      text: opts.confirmText ?? "OK",
      style: opts.destructive ? "destructive" : "default",
      onPress: opts.onConfirm,
    },
  ]);
}

/**
 * Cross-platform action sheet for 2 options + cancel
 * (used for things like "Camera or Gallery?").
 */
export function pickAction(
  title: string,
  options: { label: string; onPress: () => void }[],
  cancelText = "Cancel",
) {
  if (Platform.OS === "web") {
    // Best-effort on web: ask the user via window.confirm for each option
    // until one is accepted. For 2 options this works as "OK/Cancel" choice.
    if (options.length === 2) {
      const choice = window.confirm(`${title}\n\n${options[0].label} — OK · ${options[1].label} — Cancel`);
      (choice ? options[0] : options[1]).onPress();
      return;
    }
    // 1 option fallback
    if (window.confirm(`${title}\n\n${options[0].label}`)) options[0].onPress();
    return;
  }

  Alert.alert(title, undefined, [
    ...options.map((o) => ({ text: o.label, onPress: o.onPress })),
    { text: cancelText, style: "cancel" as const },
  ]);
}
