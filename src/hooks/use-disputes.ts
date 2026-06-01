import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Dispute, DisputeStatus } from "@/types";
import Toast from "react-native-toast-message";

export function useMyDisputes() {
  return useQuery({
    queryKey: ["disputes", "my"],
    queryFn: () => api.get<Dispute[]>("/disputes/my").then((r) => r.data),
  });
}

export function useOpenDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      rental_request_id: string;
      reason: string;
      description?: string;
      evidence?: string[];
    }) => api.post<Dispute>("/disputes", payload).then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Спор открыт" });
      void qc.invalidateQueries({ queryKey: ["disputes"] });
      void qc.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (e: Error) =>
      Toast.show({ type: "error", text1: e.message ?? "Не удалось открыть" }),
  });
}

export function useAdminDisputes(status?: DisputeStatus | "ALL") {
  return useQuery({
    queryKey: ["disputes", "admin", status ?? "ALL"],
    queryFn: () =>
      api
        .get<Dispute[]>(
          `/disputes/admin/all${status && status !== "ALL" ? `?status=${status}` : ""}`,
        )
        .then((r) => r.data),
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      deposit_to_renter,
      admin_note,
    }: {
      id: string;
      status: DisputeStatus;
      deposit_to_renter?: number;
      admin_note?: string;
    }) =>
      api
        .patch(`/disputes/admin/${id}/resolve`, {
          status,
          deposit_to_renter,
          admin_note,
        })
        .then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Спор разрешён" });
      void qc.invalidateQueries({ queryKey: ["disputes"] });
    },
    onError: (e: Error) =>
      Toast.show({ type: "error", text1: e.message ?? "Ошибка" }),
  });
}

export function useAddDisputeEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, images }: { id: string; images: string[] }) =>
      api
        .post<Dispute>(`/disputes/${id}/evidence`, { images })
        .then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Фото добавлены" });
      void qc.invalidateQueries({ queryKey: ["disputes"] });
    },
    onError: (e: Error) =>
      Toast.show({ type: "error", text1: e.message ?? "Ошибка" }),
  });
}
