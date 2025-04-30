import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Favorite } from "@/types";
import Toast from "react-native-toast-message";

export function useMyFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => api.get<Favorite[]>("/favorites").then((r) => r.data),
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) =>
      api.post(`/favorites/${listingId}`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      Toast.show({ type: "success", text1: "Добавлено в избранное" });
    },
    onError: () => Toast.show({ type: "error", text1: "Ошибка" }),
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) =>
      api.delete(`/favorites/${listingId}`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      Toast.show({ type: "success", text1: "Убрано из избранного" });
    },
    onError: () => Toast.show({ type: "error", text1: "Ошибка" }),
  });
}
