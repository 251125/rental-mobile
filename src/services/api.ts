import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "@/constants";

const TOKEN_KEY = "access_token";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
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

    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message;
    return Promise.reject(
      new Error(Array.isArray(message) ? message[0] : message),
    );
  },
);

export default api;
