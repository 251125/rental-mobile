import { useLocaleStore } from "@/store/locale.store";
import { i18n } from "./index";

/**
 * Hook that returns a translator function bound to the current locale.
 * Re-renders when the user switches language via the locale store.
 */
export function useT() {
  // Subscribe to locale so consuming components re-render on language change
  const locale = useLocaleStore((s) => s.locale);

  return (key: string, params?: Record<string, string | number>) => {
    return i18n.t(key, { ...params, locale });
  };
}
