import { Platform } from "react-native";

// Измени на IP своей машины для тестирования с телефона
export const MACHINE_IP = "192.168.10.6";

export const API_URL =
  Platform.OS === "web" ? "http://localhost:3001" : `http://${MACHINE_IP}:3001`;

export const MINIO_URL =
  Platform.OS === "web" ? "http://localhost:9000" : `http://${MACHINE_IP}:9000`;

// Исправляет localhost → IP в URL картинок от MinIO
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (Platform.OS !== "web" && url.includes("localhost")) {
    return url.replace("localhost", MACHINE_IP);
  }
  return url;
}

export const COLORS = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  danger: "#dc2626",
  success: "#16a34a",
  warning: "#d97706",
  muted: "#6b7280",
  border: "#e5e7eb",
  background: "#f9fafb",
  white: "#ffffff",
  text: "#111827",
  textSecondary: "#6b7280",
};
