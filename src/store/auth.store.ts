import { create } from "zustand";
import { User } from "@/types";
import { setToken, removeToken } from "@/services/api";

interface AuthState {
  user: User | null;
  access_token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  access_token: null,
  isAuthenticated: false,

  setAuth: async (user, token) => {
    await setToken(token);
    set({ user, access_token: token, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await removeToken();
    set({ user: null, access_token: null, isAuthenticated: false });
  },
}));
