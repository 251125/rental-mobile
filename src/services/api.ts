import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_URL } from "@/constants";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

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
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(REFRESH_TOKEN_KEY);
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

async function setRefreshToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

const api = axios.create({
  baseURL: API_URL,
  // Mobile clients can't use httpOnly cookies — backend identifies us by this
  // header and returns refresh_token in the response body for SecureStore.
  // X-Requested-With also satisfies the backend's CSRF guard on /auth/refresh.
  headers: {
    "Content-Type": "application/json",
    "X-Mobile-Client": "1",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Save tokens only when they come from a known auth endpoint. We DON'T want
// any random response that happens to contain `access_token` (e.g. an admin
// debug screen) to overwrite the logged-in user's stored credentials.
const AUTH_TOKEN_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

api.interceptors.response.use(async (response) => {
  const path = response.config.url ?? "";
  const isAuthEndpoint = AUTH_TOKEN_PATHS.some((p) => path.endsWith(p));
  if (!isAuthEndpoint) return response;

  const data = response.data as { access_token?: string; refresh_token?: string } | undefined;
  if (data?.access_token) await setToken(data.access_token);
  if (data?.refresh_token) await setRefreshToken(data.refresh_token);
  return response;
});

// Shared promise so multiple concurrent 401s don't trigger parallel refreshes
let refreshPromise: Promise<string> | null = null;
async function doRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refresh_token = await getRefreshToken();
      if (!refresh_token) throw new Error("no refresh token");
      const res = await axios.post<{ access_token: string; refresh_token: string }>(
        `${API_URL}/auth/refresh`,
        { refresh_token },
        {
          headers: {
            "X-Mobile-Client": "1",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      await setToken(res.data.access_token);
      if (res.data.refresh_token) await setRefreshToken(res.data.refresh_token);
      return res.data.access_token;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const access_token = await doRefresh();
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
