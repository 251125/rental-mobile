import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, KZ_CITIES } from "@/constants";

interface Props {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

export default function CityPicker({ value, onChange, placeholder = "Выберите город" }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? KZ_CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : KZ_CITIES;

  const handleSelect = (city: string) => {
    onChange(city);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Ionicons name="location-outline" size={16} color={value ? COLORS.primary : COLORS.muted} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Выберите город</Text>
            <TouchableOpacity onPress={() => { setOpen(false); setSearch(""); }}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Поиск города..."
              placeholderTextColor={COLORS.muted}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={COLORS.muted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <TouchableOpacity
                  style={[styles.cityItem, selected && styles.cityItemActive]}
                  onPress={() => handleSelect(item)}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={selected ? COLORS.primary : COLORS.muted}
                  />
                  <Text style={[styles.cityText, selected && styles.cityTextActive]}>{item}</Text>
                  {selected && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.noResults}>Город не найден</Text>
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.white,
  },
  triggerText: { flex: 1, fontSize: 15, color: COLORS.text },
  placeholder: { color: COLORS.muted },

  sheet: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text },

  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cityItemActive: { backgroundColor: COLORS.primaryLight },
  cityText: { flex: 1, fontSize: 15, color: COLORS.text },
  cityTextActive: { color: COLORS.primary, fontWeight: "600" },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 52 },
  noResults: { textAlign: "center", color: COLORS.muted, marginTop: 40, fontSize: 15 },
});
