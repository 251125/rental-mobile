import React, { useEffect, useState } from "react";
import { Image, View, Text, StyleSheet, ImageStyle, StyleProp } from "react-native";
import { COLORS, resolveImageUrl } from "@/constants";

interface Props {
  url?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Avatar with built-in fallback to a letter placeholder.
 * On react-native-web a broken/blocked image source renders as nothing —
 * onError flips to the placeholder so the user always sees something.
 */
export default function UserAvatar({ url, name, size = 40, style }: Props) {
  const resolved = url ? resolveImageUrl(url) ?? null : null;
  const [uri, setUri] = useState<string | null>(resolved);

  useEffect(() => {
    setUri(url ? resolveImageUrl(url) ?? null : null);
  }, [url]);

  const dimensions = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[dimensions, style]}
        onError={() => setUri(null)}
      />
    );
  }

  return (
    <View style={[dimensions, styles.placeholder, style]}>
      <Text style={[styles.letter, { fontSize: size * 0.4 }]}>
        {name?.[0]?.toUpperCase() ?? "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  letter: {
    fontWeight: "700",
    color: COLORS.primary,
  },
});
