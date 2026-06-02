import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocaleStore } from "@/store/locale.store";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/messages";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";

export default function LanguageScreen() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>{t("Locale.title")}</Text>
      {SUPPORTED_LOCALES.map((code: Locale) => (
        <TouchableOpacity
          key={code}
          style={[styles.option, locale === code && styles.optionActive]}
          onPress={() => setLocale(code)}
        >
          <Text style={[styles.label, locale === code && styles.labelActive]}>
            {LOCALE_LABELS[code]}
          </Text>
          {locale === code && (
            <Ionicons name="checkmark" size={22} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 8 },
  hint: { fontSize: 14, color: COLORS.muted, marginBottom: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  label: { fontSize: 16, color: COLORS.text },
  labelActive: { fontWeight: "600", color: COLORS.primary },
});
