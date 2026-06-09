import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateProfile } from "@/hooks/use-profile";
import { useUploadImage } from "@/hooks/use-listings";
import { COLORS, resolveImageUrl } from "@/constants";
import { useT } from "@/i18n/useT";
import Toast from "react-native-toast-message";

export default function EditProfileScreen() {
  const t = useT();
  const { user } = useAuthStore();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutateAsync: uploadImage } = useUploadImage();
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const existingAvatar = user?.avatar_url ? resolveImageUrl(user.avatar_url) : null;

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatar_url: string | undefined;
      if (avatarUri) {
        avatar_url = await uploadImage(avatarUri);
      }
      updateProfile(
        { name, ...(avatar_url !== undefined ? { avatar_url } : {}) },
        { onSuccess: () => router.back() },
      );
    } catch {
      Toast.show({ type: "error", text1: "Ошибка загрузки фото" });
    } finally {
      setIsSaving(false);
    }
  };

  const displayAvatar = avatarUri ?? existingAvatar;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
            <View style={styles.avatarEdit}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>{t("Profile.avatarHint")}</Text>
        </View>

        <Text style={styles.label}>{t("Auth.name")}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t("Profile.yourName")}
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>{t("Auth.email")}</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email ?? ""}
          editable={false}
          placeholderTextColor={COLORS.muted}
        />
        <Text style={styles.hint}></Text>

        <TouchableOpacity
          style={[styles.saveBtn, (isPending || isSaving) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isPending || isSaving}
        >
          <Text style={styles.saveBtnText}>
            {(isPending || isSaving) ? t("Profile.saving") : t("Profile.save")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 16 },
  avatarSection: { alignItems: "center", marginBottom: 24, marginTop: 8 },
  avatarWrap: { position: "relative", marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 36, fontWeight: "700", color: COLORS.primary },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarHint: { fontSize: 12, color: COLORS.muted },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.muted,
  },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
    marginBottom: 24,
  },
  saveBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
});
