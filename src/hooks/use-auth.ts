import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import api from "@/services/api";
import { User } from "@/types";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { disconnectSocket } from "@/services/socket";

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (dto: LoginDto) =>
      api.post<AuthResponse>("/auth/login", dto).then((r) => r.data),

    onSuccess: (data) => {
      void setAuth(data.user, data.access_token).then(() => {
        Toast.show({ type: "success", text1: "Вы успешно вошли" });
        if (data.user.role === "ADMIN") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
      });
    },

    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? "Ошибка входа" });
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (dto: RegisterDto) =>
      api.post<AuthResponse>("/auth/register", dto).then((r) => r.data),

    onSuccess: (data) => {
      void setAuth(data.user, data.access_token).then(() => {
        Toast.show({ type: "success", text1: "Аккаунт успешно создан" });
        router.replace("/");
      });
    },

    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: error.message ?? "Ошибка регистрации",
      });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post("/auth/logout").then((r) => r.data),

    onSuccess: async () => {
      disconnectSocket();
      await logout();
      queryClient.clear();
      router.replace("/auth/login");
    },

    onError: async () => {
      disconnectSocket();
      await logout();
      queryClient.clear();
      router.replace("/auth/login");
    },
  });
}
