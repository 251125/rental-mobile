import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useForgotPassword } from "@/hooks/use-auth";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";

export default function ForgotPasswordScreen() {
  const t = useT();
  const [email, setEmail] = useState("");
  const { mutate: forgot, isPending, isSuccess } = useForgotPassword();

  const handleSubmit = () => {
    if (!email) return;
    forgot(email.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>{t("Auth.resetTitle")}</Text>
          <Text style={styles.subtitle}>
            {t("Auth.resetHint")}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t("Auth.email")}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.muted}
          />

          <TouchableOpacity
            style={[styles.btn, (isPending || !email) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isPending || !email}
          >
            <Text style={styles.btnText}>
              {isPending ? t("Common.loading") : t("Auth.resetSubmit")}
            </Text>
          </TouchableOpacity>

          {isSuccess && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                {t("Auth.resetOk")}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={styles.linkText}>
              {t("Auth.haveAccount")}{" "}
              <Text style={styles.linkAccent}>{t("Auth.signIn")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 24, fontWeight: "800", color: COLORS.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: "center", lineHeight: 20 },
  form: { gap: 4 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  successBox: {
    marginTop: 16,
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  successText: { color: COLORS.success, fontSize: 13, lineHeight: 18 },
  linkBtn: { alignItems: "center", marginTop: 16 },
  linkText: { fontSize: 14, color: COLORS.muted },
  linkAccent: { color: COLORS.primary, fontWeight: "600" },
});
