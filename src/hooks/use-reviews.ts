import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import Toast from "react-native-toast-message";

interface CreateReviewDto {
  rental_request_id: string;
  target_user_id: string;
  rating: number;
  comment?: string;
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReviewDto) =>
      api.post("/reviews", dto).then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Отзыв оставлен!" });
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? "Ошибка" });
    },
  });
}
