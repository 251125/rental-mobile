import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Favorite } from "@/types";
import Toast from "react-native-toast-message";
import { tl } from "@/i18n/tl";

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
      Toast.show({ type: "success", text1: tl("Listing.addedToFavorites") });
    },
    onError: () => Toast.show({ type: "error", text1: tl("Common.error") }),
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) =>
      api.delete(`/favorites/${listingId}`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      Toast.show({ type: "success", text1: tl("Listing.removedFromFavorites") });
    },
    onError: () => Toast.show({ type: "error", text1: tl("Common.error") }),
  });
}
