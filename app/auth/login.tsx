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
import { useLogin } from "@/hooks/use-auth";
import { COLORS } from "@/constants";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending } = useLogin();

  const handleLogin = () => {
    if (!email || !password) return;
    login({ email, password });
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
          <Text style={styles.subtitle}>Войдите в аккаунт</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
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

          <Text style={styles.label}>Пароль</Text>
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
              {isPending ? "Входим..." : "Войти"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push("/auth/forgot-password" as never)}
          >
            <Text style={styles.linkAccent}>Забыли пароль?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={styles.linkText}>
              Нет аккаунта?{" "}
              <Text style={styles.linkAccent}>Зарегистрироваться</Text>
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
