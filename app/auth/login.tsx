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
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { useLogin } from "@/hooks/use-auth";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const heroBg = require("../../assets/hero-bg.png");

export default function LoginScreen() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending } = useLogin();

  const handleLogin = () => {
    if (!email || !password) return;
    login({ email, password });
  };

  return (
    <ImageBackground source={heroBg} style={styles.root} resizeMode="cover">
      <View style={styles.bgOverlay} />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Diplom Rental</Text>
          <Text style={styles.subtitle}>{t("Auth.welcomeBack")}</Text>
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
            onPress={handleLogin}
            disabled={isPending}
          >
            <Text style={styles.btnText}>
              {isPending ? t("Auth.signingIn") : t("Auth.signIn")}
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 16, alignItems: "center" }}>
            <GoogleSignInButton />
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push("/auth/forgot-password" as never)}
          >
            <Text style={styles.linkAccent}>{t("Auth.forgotPassword")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={styles.linkText}>
              {t("Auth.noAccount")}{" "}
              <Text style={styles.linkAccent}>{t("Auth.signUp")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, width: "100%" },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 30, 80, 0.45)",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
  },
  form: {
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
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
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  forgotBtn: {
    alignItems: "center",
    marginTop: 12,
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
