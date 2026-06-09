import { create } from "zustand";

interface NotificationsState {
  unreadCount: number;
  increment: () => void;
  clear: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  clear: () => set({ unreadCount: 0 }),
}));
