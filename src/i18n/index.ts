import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { messages, SUPPORTED_LOCALES, type Locale } from "./messages";

const i18n = new I18n(messages);
i18n.defaultLocale = "ru";
i18n.enableFallback = true;

function detectSystemLocale(): Locale {
  const tags = Localization.getLocales().map((l) => l.languageCode);
  for (const tag of tags) {
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (SUPPORTED_LOCALES.includes(lower as Locale)) return lower as Locale;
  }
  return "ru";
}

i18n.locale = detectSystemLocale();

export { i18n, detectSystemLocale };
export type { Locale };
