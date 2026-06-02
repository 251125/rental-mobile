import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { COLORS, API_URL, resolveImageUrl } from "@/constants";
import api from "@/services/api";
import { RentalRequest } from "@/types";
import Toast from "react-native-toast-message";
import { useT } from "@/i18n/useT";

export default function ScanPayScreen() {
  const t = useT();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuthStore();

  const [rental, setRental] = useState<RentalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetch(`${API_URL}/rental-requests/scan/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error(t("Rental.scanInvalidLink"));
        return r.json() as Promise<RentalRequest>;
      })
      .then((data) => {
        setRental(data);
        if (data.payment_status === "PAID") setPaid(true);
      })
      .catch((e: Error) => setError(e.message ?? t("Rental.scanLoadError")))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handlePay = async () => {
    if (!rental) return;
    setIsPaying(true);
    try {
      await api.post(`/wallet/pay/${rental.id}`);
      setPaid(true);
      Toast.show({ type: "success", text1: t("Rental.scanPaymentOk") });
      setTimeout(() => router.replace("/rentals/my" as never), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("Rental.scanPaymentErr");
      Toast.show({ type: "error", text1: msg });
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !rental) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={56} color={COLORS.danger} />
        <Text style={styles.errorText}>{error ?? t("Rental.scanNotFound")}</Text>
      </View>
    );
  }

  if (paid) {
    return (
      <View style={styles.center}>
        <Text style={styles.paidEmoji}>🎉</Text>
        <Text style={styles.paidTitle}>{t("Rental.scanPaid")}</Text>
        <Text style={styles.paidSub}>{t("Rental.scanPaidSub")}</Text>
        <TouchableOpacity
          style={styles.myRentalsBtn}
          onPress={() => router.replace("/rentals/my" as never)}
        >
          <Text style={styles.myRentalsBtnText}>{t("Rental.scanMyRentals")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const img = rental.listing.images[0];
  const startDate = new Date(rental.start_date).toLocaleDateString();
  const endDate = new Date(rental.end_date).toLocaleDateString();
  const deposit = Number(rental.deposit ?? 0);
  const totalCharge = Number(rental.total_price) + deposit;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {img ? (
        <Image
          source={{ uri: resolveImageUrl(img.image_url) ?? "" }}
          style={styles.listingImg}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.listingImg, styles.imgPlaceholder]}>
          <Ionicons name="image-outline" size={48} color={COLORS.border} />
        </View>
      )}

      <Text style={styles.listingTitle}>{rental.listing.title}</Text>
      <Text style={styles.listingCity}>
        <Ionicons name="location-outline" size={13} color={COLORS.muted} />{" "}
        {rental.listing.city}
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoLabel}>{t("Rental.scanRentalPeriod")}</Text>
          <Text style={styles.infoValue}>
            {startDate} — {endDate}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="pricetag-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoLabel}>{t("Rental.scanRentalCost")}</Text>
          <Text style={styles.infoValue}>{Number(rental.total_price).toLocaleString()} ₸</Text>
        </View>
        {deposit > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="shield-outline" size={18} color={COLORS.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{t("Listing.deposit")}</Text>
                <Text style={styles.depositNote}>{t("Rental.scanDepositReturned")}</Text>
              </View>
              <Text style={styles.infoValue}>{deposit.toLocaleString()} ₸</Text>
            </View>
          </>
        )}
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoLabel}>{t("Rental.scanTotalToPay")}</Text>
          <Text style={[styles.infoValue, styles.totalPrice]}>
            {totalCharge.toLocaleString()} ₸
          </Text>
        </View>
      </View>

      {rental.renter && (
        <View style={styles.renterCard}>
          <Text style={styles.renterCardTitle}>{t("Rental.scanRenter")}</Text>
          <View style={styles.renterRow}>
            {rental.renter.avatar_url ? (
              <Image
                source={{ uri: resolveImageUrl(rental.renter.avatar_url) ?? "" }}
                style={styles.renterAvatar}
              />
            ) : (
              <View style={[styles.renterAvatar, styles.renterAvatarFallback]}>
                <Text style={styles.renterAvatarLetter}>
                  {rental.renter.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.renterName}>{rental.renter.name}</Text>
          </View>
        </View>
      )}

      {!user ? (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>{t("Rental.scanLoginToPay")}</Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>{t("Rental.scanLoginBtn")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.payBtn, isPaying && { opacity: 0.6 }]}
          onPress={handlePay}
          disabled={isPaying}
        >
          {isPaying ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.payBtnText}>{t("Rental.scanPayBtn")} {totalCharge.toLocaleString()} ₸</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
  },
  errorText: { fontSize: 15, color: COLORS.danger, textAlign: "center" },
  listingImg: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginBottom: 16,
  },
  imgPlaceholder: {
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  listingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  listingCity: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  depositNote: { fontSize: 11, color: COLORS.warning, marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  renterCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  renterCardTitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 10,
    fontWeight: "600",
  },
  renterRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  renterAvatar: { width: 44, height: 44, borderRadius: 22 },
  renterAvatarFallback: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  renterAvatarLetter: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  renterName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  payBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  payBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 17 },
  loginPrompt: { alignItems: "center", gap: 12 },
  loginPromptText: { fontSize: 15, color: COLORS.muted },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  loginBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  paidEmoji: { fontSize: 64 },
  paidTitle: { fontSize: 28, fontWeight: "800", color: COLORS.success },
  paidSub: { fontSize: 15, color: COLORS.muted },
  myRentalsBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 8,
  },
  myRentalsBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});
