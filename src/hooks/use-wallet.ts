import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { WalletData } from "@/types";
import Toast from "react-native-toast-message";

export function useWallet() {
  return useQuery<WalletData>({
    queryKey: ["wallet"],
    queryFn: () => api.get("/wallet").then((r) => r.data),
  });
}

export function useTopUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) =>
      api.post("/wallet/top-up", { amount }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      Toast.show({ type: "success", text1: "Баланс пополнен" });
    },
    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? "Ошибка" });
    },
  });
}

export function usePayRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rentalRequestId: string) =>
      api.post(`/wallet/pay/${rentalRequestId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["rentals"] });
      Toast.show({ type: "success", text1: "Оплата прошла успешно" });
    },
    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? "Ошибка оплаты" });
    },
  });
}

export type PromotionTier = "basic" | "pro" | "premium";

export interface PromotionPlan {
  key: PromotionTier;
  price: number;
  days: number;
}

export function usePromotionTiers() {
  return useQuery({
    queryKey: ["promotion-tiers"],
    queryFn: () =>
      api.get<PromotionPlan[]>("/wallet/promotion-tiers").then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function usePromoteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, tier }: { listingId: string; tier: PromotionTier }) =>
      api
        .post<{ promoted_until: string; price: number; tier: PromotionTier }>(
          `/wallet/promote/${listingId}`,
          { tier },
        )
        .then((r) => r.data),
    onSuccess: (data) => {
      Toast.show({ type: "success", text1: `Объявление продвинуто (${data.tier})` });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (e: Error) =>
      Toast.show({ type: "error", text1: e.message ?? "Не удалось продвинуть" }),
  });
}

export function useSubscribePremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .post<{ premium_until: string; price: number }>("/wallet/premium")
        .then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Premium активирован на 30 дней" });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["users", "me"] });
    },
    onError: (e: Error) =>
      Toast.show({
        type: "error",
        text1: e.message ?? "Не удалось активировать Premium",
      }),
  });
}
