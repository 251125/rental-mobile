import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, KZ_CITY_COORDS } from "@/constants";

interface Props {
  city: string;
}

export default function CityMap({ city }: Props) {
  const coords = KZ_CITY_COORDS[city];

  if (Platform.OS !== "web" || !coords) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="location-outline" size={24} color={COLORS.muted} />
        <Text style={styles.placeholderText}>{city}</Text>
      </View>
    );
  }

  const [lat, lng] = coords;
  const delta = 0.08;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return React.createElement("iframe", {
    src,
    style: {
      width: "100%",
      height: 220,
      border: "none",
      borderRadius: 12,
      display: "block",
    },
    title: `Карта: ${city}`,
    loading: "lazy",
  });
}

const styles = StyleSheet.create({
  placeholder: {
    height: 80,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    flexDirection: "row",
  },
  placeholderText: { color: COLORS.muted, fontSize: 14 },
});
