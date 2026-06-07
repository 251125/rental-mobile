import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";

const ITEM_HEIGHT = 48;
const VISIBLE = 5;

interface Props {
  value: string; // "HH:MM" or ""
  onChange: (time: string) => void;
  onClear: () => void;
}

function Drum({
  data,
  selected,
  onSelect,
}: {
  data: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const listRef = useRef<FlatList>(null);
  const selectedIdx = data.indexOf(selected);

  const snapToIndex = (offsetY: number) => {
    const idx = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    onSelect(data[clamped]);
  };

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(item) => item}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      initialScrollIndex={Math.max(0, selectedIdx)}
      onScrollEndDrag={(e) => snapToIndex(e.nativeEvent.contentOffset.y)}
      onMomentumScrollEnd={(e) => snapToIndex(e.nativeEvent.contentOffset.y)}
      style={{ height: ITEM_HEIGHT * VISIBLE }}
      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE / 2) }}
      renderItem={({ item }) => {
        const isSelected = item === selected;
        return (
          <TouchableOpacity
            style={[styles.drumItem, isSelected && styles.drumItemSelected]}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.drumText, isSelected && styles.drumTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export default function TimePicker({ value, onChange, onClear }: Props) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [hour, setHour] = useState(() => (value ? value.split(":")[0] : "10"));
  const [minute, setMinute] = useState(() => (value ? value.split(":")[1] : "00"));

  // Web: overlay a hidden <input type="time"> over a styled trigger row.
  // Clear button lives OUTSIDE the relative container so the input overlay never covers it.
  if (Platform.OS === "web") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
        <View style={[styles.webTrigger, { position: "relative" as const }]}>
          <Ionicons name="time-outline" size={18} color={value ? COLORS.primary : COLORS.muted} />
          <Text style={[styles.triggerText, value ? styles.triggerTextActive : null]}>
            {value || t("Rental.pickReturnTime")}
          </Text>
          {React.createElement("input", {
            type: "time",
            value: value || "",
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.value) onChange(e.target.value);
              else onClear();
            },
            style: {
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
              width: "100%",
              height: "100%",
            },
          })}
        </View>
        {value && (
          <TouchableOpacity onPress={onClear} style={styles.webClearBtn}>
            <Text style={styles.webClearText}>{t("Rental.resetShort")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const open = () => {
    if (value) {
      setHour(value.split(":")[0]);
      setMinute(value.split(":")[1]);
    }
    setVisible(true);
  };

  const confirm = () => {
    onChange(`${hour}:${minute}`);
    setVisible(false);
  };

  const clear = () => {
    onClear();
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={open} activeOpacity={0.7}>
        <Ionicons name="time-outline" size={18} color={value ? COLORS.primary : COLORS.muted} />
        <Text style={[styles.triggerText, value ? styles.triggerTextActive : null]}>
          {value || t("Rental.pickReturnTime")}
        </Text>
        {value ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t("Rental.returnTimeTitle")}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.drums}>
              <View style={styles.drumWrap}>
                <Text style={styles.drumLabel}>{t("Rental.hours")}</Text>
                <Drum data={HOURS} selected={hour} onSelect={setHour} />
              </View>
              <Text style={styles.colon}>:</Text>
              <View style={styles.drumWrap}>
                <Text style={styles.drumLabel}>{t("Rental.minutes")}</Text>
                <Drum data={MINUTES} selected={minute} onSelect={setMinute} />
              </View>
            </View>

            <View style={styles.highlightBar} pointerEvents="none" />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clear}>
                <Text style={styles.clearBtnText}>{t("Rental.resetShort")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
                <Text style={styles.confirmBtnText}>{t("Rental.done")} — {hour}:{minute}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    marginTop: 14,
  },
  webTrigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  webClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  webClearText: {
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: "600",
  },
  triggerText: { flex: 1, fontSize: 15, color: COLORS.muted },
  triggerTextActive: { color: COLORS.text, fontWeight: "600" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },

  drums: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    position: "relative",
  },
  drumWrap: { alignItems: "center", flex: 1 },
  drumLabel: { fontSize: 11, color: COLORS.muted, fontWeight: "600", marginBottom: 4 },
  colon: { fontSize: 28, fontWeight: "800", color: COLORS.text, paddingTop: 24 },

  drumItem: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  drumItemSelected: { backgroundColor: "#dbeafe" },
  drumText: { fontSize: 22, color: COLORS.muted },
  drumTextSelected: { fontSize: 26, color: COLORS.primary, fontWeight: "700" },

  highlightBar: {
    position: "absolute",
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    top: "50%",
    marginTop: -ITEM_HEIGHT / 2 + 20,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    pointerEvents: "none",
  },

  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  clearBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  clearBtnText: { color: COLORS.muted, fontWeight: "600" },
  confirmBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  confirmBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});
