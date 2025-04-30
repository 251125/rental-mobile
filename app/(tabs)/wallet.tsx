import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWallet, useTopUp } from "@/hooks/use-wallet";
import LoadingSpinner from "@/components/LoadingSpinner";
import { COLORS } from "@/constants";
import { Transaction, TransactionType } from "@/types";

const TX_LABELS: Record<TransactionType, { label: string; color: string }> = {
  DEPOSIT: { label: "Пополнение", color: COLORS.success },
  PAYMENT: { label: "Оплата", color: COLORS.danger },
  INCOME: { label: "Доход", color: COLORS.success },
  REFUND: { label: "Возврат", color: COLORS.primary },
};

export default function WalletScreen() {
  const { data, isLoading } = useWallet();
  const { mutate: topUp, isPending } = useTopUp();
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");

  const handleTopUp = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    topUp(num, { onSuccess: () => { setModalVisible(false); setAmount(""); } });
  };

  if (isLoading) return <LoadingSpinner />;

  const renderTx = ({ item }: { item: Transaction }) => {
    const config = TX_LABELS[item.type];
    const isPositive = item.type === "DEPOSIT" || item.type === "INCOME" || item.type === "REFUND";
    return (
      <View style={styles.txRow}>
        <View style={styles.txLeft}>
          <Text style={styles.txLabel}>{config.label}</Text>
          <Text style={styles.txDesc} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.txDate}>
            {new Date(item.created_at).toLocaleDateString("ru-RU")}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: config.color }]}>
          {isPositive ? "+" : "-"}{Math.abs(item.amount)} ₸
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Кошелёк</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Ваш баланс</Text>
        <Text style={styles.balance}>{data?.balance ?? 0} ₸</Text>
        <TouchableOpacity
          style={styles.topUpBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
          <Text style={styles.topUpBtnText}>Пополнить</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>История транзакций</Text>

      <FlatList
        data={data?.transactions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderTx}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyText}>Транзакций нет</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Пополнить баланс</Text>
            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Сумма в ₸"
              placeholderTextColor={COLORS.muted}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setModalVisible(false); setAmount(""); }}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, isPending && { opacity: 0.6 }]}
                onPress={handleTopUp}
                disabled={isPending}
              >
                <Text style={styles.modalConfirmText}>
                  {isPending ? "..." : "Пополнить"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  balanceCard: {
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  balance: { fontSize: 36, fontWeight: "800", color: COLORS.white },
  topUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  topUpBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: { paddingBottom: 24 },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
  },
  txLeft: { flex: 1, marginRight: 12 },
  txLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  txDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  txDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "700" },
  divider: { height: 1, backgroundColor: COLORS.border },
  empty: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyText: { fontSize: 14, color: COLORS.muted },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  modalCancelText: { color: COLORS.muted, fontWeight: "600" },
  modalConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  modalConfirmText: { color: COLORS.white, fontWeight: "700" },
});
