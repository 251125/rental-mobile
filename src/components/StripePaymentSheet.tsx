import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";

interface Props {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length >= 3) return d.slice(0, 2) + " / " + d.slice(2);
  return d;
}

type Step = "form" | "processing" | "success";

export default function StripePaymentSheet({ visible, amount, onClose, onSuccess }: Props) {
  const t = useT();
  const [step, setStep] = useState<Step>("form");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expiryRef = useRef<TextInput>(null);
  const cvcRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (cardNum.replace(/\s/g, "").length !== 16) e.card = t("Wallet.errCard16");
    const exp = expiry.replace(/\s\/\s/g, "");
    if (exp.length !== 4) e.expiry = t("Wallet.errExpiry");
    if (cvc.length < 3) e.cvc = t("Wallet.errCvc");
    if (!name.trim()) e.name = t("Wallet.errName");
    return e;
  };

  const handlePay = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 1600);
    }, 2200);
  };

  const resetForm = () => {
    setStep("form");
    setCardNum(""); setExpiry(""); setCvc(""); setName("");
    setErrors({});
  };

  const handleClose = () => {
    if (step === "processing") return;
    resetForm();
    onClose();
  };

  const inputStyle = (err?: string) => [
    styles.input,
    err ? styles.inputError : undefined,
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Stripe header */}
          <View style={styles.stripeHeader}>
            <View>
              <Text style={styles.stripeTitle}>Rental Platform</Text>
              <Text style={styles.stripeAmount}>{amount.toLocaleString()} ₸</Text>
              <Text style={styles.stripeSubtitle}>{t("Wallet.stripeTopUp")}</Text>
            </View>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
            </View>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={styles.body}>
            {step === "success" ? (
              <View style={styles.resultWrap}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={36} color="#fff" />
                </View>
                <Text style={styles.resultTitle}>{t("Wallet.paymentDone")}</Text>
                <Text style={styles.resultSub}>{t("Wallet.addedToWallet", { amount: amount.toLocaleString() })}</Text>
              </View>
            ) : step === "processing" ? (
              <View style={styles.resultWrap}>
                <ActivityIndicator size="large" color="#635BFF" />
                <Text style={styles.resultSub}>{t("Wallet.processing")}</Text>
              </View>
            ) : (
              <>
                {/* Test hint */}
                <View style={styles.hint}>
                  <Ionicons name="information-circle-outline" size={14} color="#92400e" />
                  <Text style={styles.hintText}>
                    <Text style={{ fontWeight: "700" }}>{t("Wallet.testHint")}</Text>
                    4242 4242 4242 4242 · 12/28 · 123
                  </Text>
                </View>

                {/* Card number */}
                <Text style={styles.label}>{t("Wallet.cardNum")}</Text>
                <TextInput
                  style={inputStyle(errors.card)}
                  value={cardNum}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="number-pad"
                  onChangeText={(v) => {
                    const f = formatCard(v);
                    setCardNum(f);
                    setErrors((p) => ({ ...p, card: "" }));
                    if (f.replace(/\s/g, "").length === 16) expiryRef.current?.focus();
                  }}
                />
                {errors.card ? <Text style={styles.errText}>{errors.card}</Text> : null}

                {/* Expiry + CVC */}
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{t("Wallet.expiryLabel")}</Text>
                    <TextInput
                      ref={expiryRef}
                      style={inputStyle(errors.expiry)}
                      value={expiry}
                      placeholder={t("Wallet.expiryPlaceholder")}
                      placeholderTextColor={COLORS.muted}
                      keyboardType="number-pad"
                      onChangeText={(v) => {
                        const f = formatExpiry(v);
                        setExpiry(f);
                        setErrors((p) => ({ ...p, expiry: "" }));
                        if (f.replace(/\s\/\s/g, "").length === 4) cvcRef.current?.focus();
                      }}
                    />
                    {errors.expiry ? <Text style={styles.errText}>{errors.expiry}</Text> : null}
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>CVC</Text>
                    <TextInput
                      ref={cvcRef}
                      style={inputStyle(errors.cvc)}
                      value={cvc}
                      placeholder="123"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                      onChangeText={(v) => {
                        const d = v.replace(/\D/g, "").slice(0, 4);
                        setCvc(d);
                        setErrors((p) => ({ ...p, cvc: "" }));
                        if (d.length >= 3) nameRef.current?.focus();
                      }}
                    />
                    {errors.cvc ? <Text style={styles.errText}>{errors.cvc}</Text> : null}
                  </View>
                </View>

                {/* Name */}
                <Text style={styles.label}>{t("Wallet.cardName")}</Text>
                <TextInput
                  ref={nameRef}
                  style={inputStyle(errors.name)}
                  value={name}
                  placeholder="IVAN PETROV"
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="characters"
                  onChangeText={(v) => {
                    setName(v.toUpperCase());
                    setErrors((p) => ({ ...p, name: "" }));
                  }}
                />
                {errors.name ? <Text style={styles.errText}>{errors.name}</Text> : null}

                {/* Pay button */}
                <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
                  <Ionicons name="lock-closed" size={16} color="#fff" />
                  <Text style={styles.payBtnText}>{t("Wallet.payBtn")} {amount.toLocaleString()} ₸</Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                  <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.muted} />
                  <Text style={styles.footerText}>{t("Wallet.protectedBy")}</Text>
                  <Text style={[styles.footerText, { fontStyle: "italic", fontWeight: "700", color: "#635BFF" }]}>
                    stripe
                  </Text>
                  <Text style={styles.footerText}>{t("Wallet.testModeStr")}</Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 12,
  },
  stripeHeader: {
    backgroundColor: "#635BFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  stripeTitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 4 },
  stripeAmount: { color: "#fff", fontSize: 28, fontWeight: "800" },
  stripeSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  lockBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
  },
  body: { paddingHorizontal: 16, paddingBottom: 40 },
  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  hintText: { fontSize: 12, color: "#92400e", flex: 1, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600", color: "#4b5563", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: "#fafafa",
  },
  inputError: { borderColor: "#f87171" },
  errText: { fontSize: 11, color: "#ef4444", marginTop: 4 },
  row: { flexDirection: "row" },
  payBtn: {
    backgroundColor: "#635BFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginTop: 16,
  },
  footerText: { fontSize: 11, color: COLORS.muted },
  resultWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  resultSub: { fontSize: 14, color: COLORS.muted, textAlign: "center" },
});
