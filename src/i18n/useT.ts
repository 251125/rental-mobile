import { useLocaleStore } from "@/store/locale.store";
import { i18n } from "./index";
import { messages } from "./messages";

const PLACEHOLDER_RE = /\{(\w+)\}/g;

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(PLACEHOLDER_RE, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match,
  );
}

/**
 * Hook that returns a translator function bound to the current locale.
 * Re-renders when the user switches language via the locale store.
 *
 * Note: i18n-js uses {{name}} placeholders by default, but our dictionaries
 * use {name} (web style, matches next-intl). We do the interpolation
 * ourselves after i18n.t resolves the key.
 */
export function useT() {
  // Subscribe to locale so consuming components re-render on language change
  const locale = useLocaleStore((s) => s.locale);

  return (key: string, params?: Record<string, string | number>) => {
    const resolved = i18n.t(key, { locale });
    return interpolate(resolved, params);
  };
}

/** Translates a category name from the DB (English) to the current locale. */
export function useCategoryName() {
  const locale = useLocaleStore((s) => s.locale);
  return (name: string): string => {
    const map = (messages[locale] as Record<string, unknown>)?.Categories as Record<string, string> | undefined;
    if (!map) return name;
    // Exact match first, then case-insensitive fallback
    if (map[name]) return map[name];
    const lower = name.toLowerCase();
    const found = Object.keys(map).find((k) => k.toLowerCase() === lower);
    return found ? map[found] : name;
  };
}
