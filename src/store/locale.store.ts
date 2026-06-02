import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { i18n, detectSystemLocale, type Locale } from "@/i18n";
import { SUPPORTED_LOCALES } from "@/i18n/messages";

const LOCALE_KEY = "user_locale";

async function savedLocale(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(LOCALE_KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(LOCALE_KEY);
}

async function persistLocale(locale: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // ignore — quota or private mode
    }
    return;
  }
  await SecureStore.setItemAsync(LOCALE_KEY, locale);
}

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: i18n.locale as Locale,
  hydrated: false,

  // Update the store FIRST so the UI re-renders immediately. Persistence is
  // best-effort and must not block (or, worse, swallow) the locale change.
  setLocale: async (locale) => {
    i18n.locale = locale;
    set({ locale });
    try {
      await persistLocale(locale);
    } catch {
      // ignore — choice still applies for this session
    }
  },

  hydrate: async () => {
    try {
      const saved = await savedLocale();
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
