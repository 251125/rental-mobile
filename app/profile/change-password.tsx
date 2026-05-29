import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useChangePassword } from "@/hooks/use-auth";
import { COLORS } from "@/constants";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutate: changePassword, isPending } = useChangePassword();

  useEffect(() => {
    navigation.setOptions({
      title: "Смена пароля",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace("/(tabs)/profile")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: 4 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      return;
    }
    if (newPassword.length < 6) return;
    changePassword({ currentPassword, newPassword });
  };

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 6;
  const canSubmit = !!(currentPassword && newPassword && confirmPassword && !mismatch && !tooShort);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.subtitle}>
          Введите текущий пароль и придумайте новый (минимум 6 символов)
        </Text>

        <Text style={styles.label}>Текущий пароль</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            placeholder="Введите текущий пароль"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowCurrent((v) => !v)}
          >
            <Ionicons
              name={showCurrent ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Новый пароль</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            placeholder="Минимум 6 символов"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowNew((v) => !v)}
          >
            <Ionicons
              name={showNew ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        </View>
        {tooShort && (
          <Text style={styles.errorText}>Пароль должен содержать минимум 6 символов</Text>
        )}

        <Text style={styles.label}>Подтвердите новый пароль</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, mismatch && styles.inputError]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            placeholder="Повторите новый пароль"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowConfirm((v) => !v)}
          >
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        </View>
        {mismatch && (
          <Text style={styles.errorText}>Пароли не совпадают</Text>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || isPending) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!canSubmit || isPending}
        >
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.submitText}>
            {isPending ? "Сохраняем..." : "Изменить пароль"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 20 },
  iconWrap: {
    alignItems: "center",
    marginVertical: 16,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignSelf: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.danger },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  submitText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
});
