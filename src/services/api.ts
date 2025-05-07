import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_URL } from "@/constants";

const TOKEN_KEY = "access_token";

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {});
        const { access_token } = res.data as { access_token: string };
        await setToken(access_token);
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch {
        await removeToken();
      }
    }

    if (!error.response) {
      return Promise.reject(new Error("Сервер недоступен. Проверьте подключение."));
    }

    const status = error.response.status;
    const serverMessage =
      error.response?.data?.message ??
      error.response?.data?.error ??
      null;

    if (serverMessage) {
      const msg = Array.isArray(serverMessage) ? serverMessage[0] : serverMessage;
      return Promise.reject(new Error(msg));
    }

    const fallback: Record<number, string> = {
      400: "Неверный запрос",
      401: "Неверный email или пароль",
      403: "Доступ запрещён",
      404: "Не найдено",
      409: "Пользователь с таким email уже существует",
      422: "Ошибка валидации данных",
      500: "Ошибка сервера. Попробуйте позже",
    };

    return Promise.reject(new Error(fallback[status] ?? "Что-то пошло не так"));
  },
);

export default api;
