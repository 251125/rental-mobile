import React from "react";
import { TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";

/**
 * Header back button that works even after a hard reload.
 * On web, refreshing a deep URL produces an empty navigation history, so
 * the default header back arrow disappears. We always render our own and
 * fall back to the home tabs when there's nothing to pop.
 */
export default function HeaderBack({ fallback = "/(tabs)" }: { fallback?: string }) {
  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as never);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ marginLeft: 4, padding: 4 }}
    >
      <Ionicons name="chevron-back" size={26} color={COLORS.text} />
    </TouchableOpacity>
  );
}
