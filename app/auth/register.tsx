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
import { useRegister } from "@/hooks/use-auth";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function RegisterScreen() {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: register, isPending } = useRegister();

  const handleRegister = () => {
    if (!name || !email || !password) return;
    register({ name, email, password });
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
          <Text style={styles.logo}>Diplom Rental</Text>
          <Text style={styles.subtitle}>{t("Auth.welcomeNew")}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t("Auth.name")}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("Auth.name")}
            placeholderTextColor={COLORS.muted}
          />

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

          <Text style={styles.label}>{t("Auth.password")}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={COLORS.muted}
          />

          <TouchableOpacity
            style={[styles.btn, isPending && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isPending}
          >
            <Text style={styles.btnText}>
              {isPending ? t("Auth.signingUp") : t("Auth.signUp")}
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 16, alignItems: "center" }}>
            <GoogleSignInButton />
          </View>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.back()}
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
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
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
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  linkBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  linkAccent: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
