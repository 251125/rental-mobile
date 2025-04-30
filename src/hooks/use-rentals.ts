import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { RentalRequest, RentalRequestStatus } from "@/types";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/store/auth.store";

export function useMyRentals() {
  return useQuery({
    queryKey: ["rentals", "my"],
    queryFn: () =>
      api.get<RentalRequest[]>("/rental-requests/my").then((r) => r.data),
  });
}

export function useIncomingRentals() {
  return useQuery({
    queryKey: ["rentals", "incoming"],
    queryFn: () =>
      api
        .get<RentalRequest[]>("/rental-requests/incoming")
        .then((r) => r.data),
  });
}

export function useIncomingRentalsCount() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["rentals", "incoming", "count"],
    queryFn: () =>
      api
        .get<RentalRequest[]>("/rental-requests/incoming")
        .then((r) => r.data.filter((req) => req.status === "PENDING").length),
    enabled: isAuthenticated,
  });
}

export function useCreateRentalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      listing_id: string;
      start_date: string;
      end_date: string;
    }) => api.post<RentalRequest>("/rental-requests", dto).then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Заявка отправлена!" });
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? "Ошибка" });
    },
  });
}

export function useUpdateRentalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: RentalRequestStatus;
    }) =>
      api
        .patch(`/rental-requests/${id}/status`, { status })
        .then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Статус обновлён" });
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? "Ошибка" });
    },
  });
}

export function useCancelRental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/rental-requests/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Заявка отменена" });
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? "Ошибка" });
    },
  });
}
