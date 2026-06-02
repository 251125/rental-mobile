import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { i18n, detectSystemLocale, type Locale } from "@/i18n";
import { SUPPORTED_LOCALES } from "@/i18n/messages";

const LOCALE_KEY = "user_locale";

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: i18n.locale as Locale,
  hydrated: false,

  setLocale: async (locale) => {
    i18n.locale = locale;
    await SecureStore.setItemAsync(LOCALE_KEY, locale);
    set({ locale });
  },

  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(LOCALE_KEY);
      if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) {
        i18n.locale = saved;
        set({ locale: saved as Locale, hydrated: true });
        return;
      }
    } catch {
      // fall through to system detection
    }
    const detected = detectSystemLocale();
    i18n.locale = detected;
    set({ locale: detected, hydrated: true });
  },
}));
