import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { BlockedUser } from "@/types";
import Toast from "react-native-toast-message";

export function useBlockedUsers() {
  return useQuery({
    queryKey: ["users", "blocked"],
    queryFn: () =>
      api.get<BlockedUser[]>("/users/me/blocked").then((r) => r.data),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/users/${id}/block`).then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Пользователь заблокирован" });
      void qc.invalidateQueries({ queryKey: ["users", "blocked"] });
    },
    onError: (e: Error) =>
      Toast.show({ type: "error", text1: e.message ?? "Ошибка" }),
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/users/${id}/block`).then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Разблокировано" });
      void qc.invalidateQueries({ queryKey: ["users", "blocked"] });
    },
    onError: (e: Error) =>
      Toast.show({ type: "error", text1: e.message ?? "Ошибка" }),
  });
}
