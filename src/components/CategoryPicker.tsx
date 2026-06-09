import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { useT, useCategoryName } from "@/i18n/useT";

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export default function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder,
}: Props) {
  const t = useT();
  const categoryName = useCategoryName();
  const effectivePlaceholder = placeholder ?? t("Listing.selectCategory");
  const [open, setOpen] = useState(false);

  const selected = categories.find((c) => c.id === value);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Ionicons
          name="list-outline"
          size={16}
          color={value ? COLORS.primary : COLORS.muted}
        />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {selected ? categoryName(selected.name) : effectivePlaceholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("Listing.selectCategory")}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = item.id === value;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.itemActive]}
                  onPress={() => handleSelect(item.id)}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={16}
                    color={isSelected ? COLORS.primary : COLORS.muted}
                  />
                  <Text style={[styles.itemText, isSelected && styles.itemTextActive]}>
                    {categoryName(item.name)}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.empty}>{t("Listing.categoryNotFound")}</Text>
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

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemActive: { backgroundColor: COLORS.primaryLight ?? "#e8f0fe" },
  itemText: { flex: 1, fontSize: 15, color: COLORS.text },
  itemTextActive: { color: COLORS.primary, fontWeight: "600" },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 52 },
  empty: {
    textAlign: "center",
    color: COLORS.muted,
    marginTop: 40,
    fontSize: 15,
  },
});
