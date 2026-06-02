import { Alert, Platform } from "react-native";

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
 * `Alert.alert` with action buttons is unreliable on react-native-web
 * (often just shows the title and no buttons). On web we fall back to
 * the browser's native confirm() so the action button always works.
 */
export function confirm({
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  destructive,
  onConfirm,
}: ConfirmOptions) {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    if (window.confirm(text)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: "cancel" },
    {
      text: confirmText,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
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
