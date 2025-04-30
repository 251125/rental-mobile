import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { User } from "@/types";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/store/auth.store";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/users/me").then((r) => r.data),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => api.get<User>(`/users/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUserReviews(userId: string) {
  return useQuery({
    queryKey: ["reviews", userId],
    queryFn: () =>
      api.get(`/reviews/user/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: FormData) =>
      api
        .patch<User>("/users/me", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setUser(data);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      Toast.show({ type: "success", text1: "Профиль обновлён" });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: error.message ?? "Ошибка обновления",
      });
    },
  });
}
