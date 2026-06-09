/**
 * Non-hook translator for use inside useMutation callbacks, hooks, etc.
 * Reads locale from Zustand store directly (no React context needed).
 */
import { i18n } from "./index";
import { useLocaleStore } from "@/store/locale.store";

const PLACEHOLDER_RE = /\{(\w+)\}/g;

export function tl(key: string, params?: Record<string, string | number>): string {
  const locale = useLocaleStore.getState().locale;
  const resolved = i18n.t(key, { locale });
  if (!params) return resolved;
  return resolved.replace(PLACEHOLDER_RE, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`
  );
}
