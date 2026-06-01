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
import { router, useLocalSearchParams } from "expo-router";
import { useResetPassword } from "@/hooks/use-auth";
import Toast from "react-native-toast-message";
import { COLORS } from "@/constants";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { mutate: reset, isPending } = useResetPassword();

  const handleSubmit = () => {
    if (!token) {
      Toast.show({ type: "error", text1: "Ссылка недействительна" });
      return;
    }
    if (password.length < 8) {
      Toast.show({ type: "error", text1: "Пароль минимум 8 символов" });
      return;
    }
    if (password !== confirm) {
      Toast.show({ type: "error", text1: "Пароли не совпадают" });
      return;
    }
    reset({ token, password });
  };

  if (!token) {
    return (
      <View style={[styles.flex, { justifyContent: "center", padding: 24 }]}>
        <Text style={styles.invalid}>
          Ссылка для сброса недействительна. Запросите новую.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace("/auth/forgot-password" as never)}
        >
          <Text style={styles.btnText}>Запросить ссылку</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <Text style={styles.logo}>Новый пароль</Text>
          <Text style={styles.subtitle}>Введите новый пароль для аккаунта.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Не менее 8 символов"
            placeholderTextColor={COLORS.muted}
          />

          <Text style={styles.label}>Повторите пароль</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={COLORS.muted}
          />

          <TouchableOpacity
            style={[styles.btn, isPending && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            <Text style={styles.btnText}>
              {isPending ? "Сохранение..." : "Установить пароль"}
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
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: "center" },
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
  invalid: {
    fontSize: 15,
    color: COLORS.danger,
    textAlign: "center",
    marginBottom: 16,
  },
});
