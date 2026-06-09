import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import api from "@/services/api";
import { User } from "@/types";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { disconnectSocket } from "@/services/socket";
import { tl } from "@/i18n/tl";

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
        Toast.show({ type: "success", text1: tl("Auth.loginSuccess") });
        router.replace("/");
      });
    },

    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? tl("Auth.loginError") });
    },
  });
}

export function useGoogleSignIn() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (idToken: string) =>
      api
        .post<AuthResponse>("/auth/google", { id_token: idToken })
        .then((r) => r.data),

    onSuccess: (data) => {
      void setAuth(data.user, data.access_token).then(() => {
        Toast.show({ type: "success", text1: tl("Auth.googleSuccess") });
        router.replace("/");
      });
    },

    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? tl("Auth.googleError") });
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
        Toast.show({ type: "success", text1: tl("Auth.registerSuccess") });
        router.replace("/");
      });
    },

    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: error.message ?? tl("Auth.registerError"),
      });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api
        .post<{ message: string }>("/auth/forgot-password", { email })
        .then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: tl("Auth.forgotPasswordSent") });
    },
    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? tl("Common.error") });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      api
        .post<{ message: string }>("/auth/reset-password", { token, password })
        .then((r) => r.data),
    onSuccess: () => {
      Toast.show({ type: "success", text1: tl("Auth.passwordChangedRelogin") });
      router.replace("/auth/login");
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: error.message ?? tl("Auth.linkExpired"),
      });
    },
  });
}

export function useChangePassword() {
  const { logout } = useAuthStore();
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api
        .post("/auth/change-password", {
          current_password: currentPassword,
          new_password: newPassword,
        })
        .then((r) => r.data),
    onSuccess: async () => {
      Toast.show({ type: "success", text1: tl("Auth.passwordChangedRelogin") });
      disconnectSocket();
      await logout();
      router.replace("/auth/login");
    },
    onError: (error: Error) => {
      Toast.show({ type: "error", text1: error.message ?? tl("Auth.changePasswordError") });
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
