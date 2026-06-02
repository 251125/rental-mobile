import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, API_URL } from "@/constants";
import api from "@/services/api";
import Toast from "react-native-toast-message";
import { useT } from "@/i18n/useT";

type ReportType = "USER" | "LISTING" | "RENTAL";

type ReasonOption = {
  label: string;
  value: string;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
}

export default function ReportModal({ visible, onClose, type, targetId }: Props) {
  const t = useT();
  const REASONS: ReasonOption[] = [
    { label: t("Report.reasonSpam"), value: "SPAM" },
    { label: t("Report.reasonFraud"), value: "FRAUD" },
    { label: t("Report.reasonInappropriate"), value: "INAPPROPRIATE" },
    { label: t("Report.reasonDamage"), value: "DAMAGE" },
    { label: t("Report.reasonOther"), value: "OTHER" },
  ];
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Toast.show({ type: "error", text1: t("Report.errReason") });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`${API_URL}/reports`, {
        type,
        target_id: targetId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      Toast.show({ type: "success", text1: t("Report.okSent") });
      handleClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("Report.errSend");
      Toast.show({ type: "error", text1: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("Report.title")}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{t("Report.selectReason")}</Text>

          {REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonRow,
                selectedReason === reason.value && styles.reasonRowSelected,
              ]}
              onPress={() => setSelectedReason(reason.value)}
            >
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason.value && styles.reasonTextSelected,
                ]}
              >
                {reason.label}
              </Text>
              {selectedReason === reason.value && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}

          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder={t("Report.descPlaceholder")}
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.btns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>{t("Common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t("Report.submit")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    paddingBottom: 36,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 13, color: COLORS.muted, marginBottom: 2 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  reasonRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  reasonText: { fontSize: 15, color: COLORS.text },
  reasonTextSelected: { color: COLORS.primary, fontWeight: "600" },
  descInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    height: 80,
    marginTop: 4,
  },
  btns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelBtnText: { color: COLORS.muted, fontWeight: "600" },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: { color: COLORS.white, fontWeight: "700" },
});
