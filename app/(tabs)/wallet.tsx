import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWallet, useTopUp, useSubscribePremium } from "@/hooks/use-wallet";
import LoadingSpinner from "@/components/LoadingSpinner";
import StripePaymentSheet from "@/components/StripePaymentSheet";
import { COLORS } from "@/constants";
import { Transaction, TransactionType } from "@/types";

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000];

const TX_LABELS: Record<TransactionType, { label: string; icon: string }> = {
  DEPOSIT: { label: "Пополнение", icon: "arrow-down-circle-outline" },
  PAYMENT: { label: "Оплата аренды", icon: "arrow-up-circle-outline" },
  INCOME: { label: "Доход", icon: "cash-outline" },
  REFUND: { label: "Возврат", icon: "refresh-circle-outline" },
  PLATFORM_FEE: { label: "Комиссия платформы", icon: "remove-circle-outline" },
  PROMOTION: { label: "Продвижение", icon: "rocket-outline" },
  PREMIUM: { label: "Premium-подписка", icon: "diamond-outline" },
};

const TX_COLORS: Record<TransactionType, string> = {
  DEPOSIT: COLORS.success,
  PAYMENT: COLORS.danger,
  INCOME: COLORS.success,
  REFUND: COLORS.primary,
  PLATFORM_FEE: COLORS.muted,
  PROMOTION: COLORS.warning,
  PREMIUM: COLORS.warning,
};

export default function WalletScreen() {
  const { data, isLoading, refetch } = useWallet();
  const { mutate: topUp } = useTopUp();
  const { mutate: subscribePremium } = useSubscribePremium();
  const [stripeVisible, setStripeVisible] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

  const handlePremium = () => {
    Alert.alert(
      data?.is_premium ? "Продлить Premium?" : "Активировать Premium?",
      "С баланса спишется 2 000 ₸ за 30 дней Premium. Если подписка ещё активна, срок продлится на 30 дней.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: data?.is_premium ? "Продлить" : "Активировать",
          onPress: () => subscribePremium(),
        },
      ],
    );
  };

  const isPositive = (t: TransactionType) =>
    t === "DEPOSIT" || t === "INCOME" || t === "REFUND";

  const openStripe = (amount: number) => {
    setPendingAmount(amount);
    setStripeVisible(true);
  };

  const handleStripeSuccess = () => {
    setStripeVisible(false);
    topUp(pendingAmount, { onSuccess: () => refetch() });
  };

  if (isLoading) return <LoadingSpinner />;

  const renderTx = ({ item }: { item: Transaction }) => {
    const cfg = TX_LABELS[item.type] ?? { label: item.type, icon: "ellipse-outline" };
    const color = TX_COLORS[item.type] ?? COLORS.muted;
    const positive = isPositive(item.type);
    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: color + "20" }]}>
          <Ionicons name={cfg.icon as any} size={20} color={color} />
        </View>
        <View style={styles.txBody}>
          <Text style={styles.txLabel}>{cfg.label}</Text>
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString("ru-RU")}</Text>
        </View>
        <Text style={[styles.txAmount, { color }]}>
          {positive ? "+" : "−"}{Math.abs(Number(item.amount)).toLocaleString()} ₸
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={data?.transactions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderTx}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Кошелёк</Text>
            </View>

            {/* Balance card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceTopRow}>
                <Ionicons name="wallet-outline" size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.balanceTag}>Rental Pay</Text>
              </View>
              <Text style={styles.balance}>
                {Number(data?.balance ?? 0).toLocaleString()} ₸
              </Text>
              <Text style={styles.balanceSub}>Доступно для оплаты аренды</Text>
            </View>

            {/* Premium card */}
            <View
              style={[
                styles.premiumCard,
                data?.is_premium && styles.premiumCardActive,
              ]}
            >
              <View style={styles.premiumLeft}>
                <View style={styles.premiumIconWrap}>
                  <Ionicons name="diamond" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.premiumTitleRow}>
                    <Text style={styles.premiumTitle}>Premium</Text>
                    {data?.is_premium && data.premium_until && (
                      <Text style={styles.premiumUntil}>
                        до {new Date(data.premium_until).toLocaleDateString("ru-RU")}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.premiumDesc}>
                    Без комиссии, статистика, бейдж, неограниченные объявления.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.premiumBtn}
                onPress={handlePremium}
              >
                <Text style={styles.premiumBtnText}>
                  {data?.is_premium ? "Продлить" : "2 000 ₸"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick top-up */}
            <View style={styles.topUpSection}>
              <Text style={styles.sectionTitle}>Пополнить картой</Text>
              <View style={styles.quickGrid}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.quickBtn}
                    onPress={() => openStripe(amt)}
                  >
                    <Text style={styles.quickBtnText}>{amt.toLocaleString()} ₸</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.customBtn}
                onPress={() => openStripe(2000)}
              >
                <Ionicons name="card-outline" size={18} color="#635BFF" />
                <Text style={styles.customBtnText}>Другая сумма</Text>
                <Ionicons name="chevron-forward" size={16} color="#635BFF" />
              </TouchableOpacity>

              {/* Stripe badge */}
              <View style={styles.stripeBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.muted} />
                <Text style={styles.stripeBadgeText}>Защищено · </Text>
                <Text style={[styles.stripeBadgeText, { fontStyle: "italic", fontWeight: "700", color: "#635BFF" }]}>
                  stripe
                </Text>
                <Text style={styles.stripeBadgeText}> · Тест</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle2}>История операций</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={44} color={COLORS.border} />
            <Text style={styles.emptyText}>Операций пока нет</Text>
          </View>
        }
      />

      <StripePaymentSheet
        visible={stripeVisible}
        amount={pendingAmount}
        onClose={() => setStripeVisible(false)}
        onSuccess={handleStripeSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingBottom: 100 },

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
    backgroundColor: "#635BFF",
    borderRadius: 20,
    padding: 24,
    gap: 6,
  },
  balanceTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  balanceTag: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  balance: { fontSize: 34, fontWeight: "800", color: "#fff" },
  balanceSub: { fontSize: 12, color: "rgba(255,255,255,0.6)" },

  premiumCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  premiumCardActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderStyle: "solid",
  },
  premiumLeft: { flexDirection: "row", flex: 1, gap: 10, alignItems: "center" },
  premiumIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
  },
  premiumTitleRow: { flexDirection: "row", gap: 6, alignItems: "baseline", flexWrap: "wrap" },
  premiumTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  premiumUntil: { fontSize: 11, color: COLORS.warning },
  premiumDesc: { fontSize: 11, color: COLORS.muted, marginTop: 2, lineHeight: 15 },
  premiumBtn: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  premiumBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  topUpSection: {
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  quickBtn: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1.5,
    borderColor: "#635BFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  quickBtnText: { color: "#635BFF", fontWeight: "700", fontSize: 14 },

  customBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#635BFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 12,
  },
  customBtnText: { flex: 1, color: "#635BFF", fontWeight: "600", fontSize: 15 },

  stripeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  stripeBadgeText: { fontSize: 11, color: COLORS.muted },

  sectionTitle2: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  txIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  txBody: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  txDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  txDate: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  txAmount: { fontSize: 15, fontWeight: "700", shrink: 0 } as any,
  divider: { height: 1, backgroundColor: COLORS.border },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.muted },
});
