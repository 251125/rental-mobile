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
