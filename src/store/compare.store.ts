import { create } from "zustand";
import { Listing } from "@/types";

export type AddResult =
  | { ok: true; reason?: "category_switched" }
  | { ok: false; reason: "max" };

interface CompareState {
  items: Listing[];
  add: (listing: Listing) => AddResult;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  validate: (listing: Listing) => string | null;
}

const MAX = 3;

export const useCompareStore = create<CompareState>((set, get) => ({
  items: [],
  validate: (listing) => {
    const { items } = get();
    if (items.length === 0) return null;
    if (items[0].category_id === listing.category_id && items.length >= MAX) {
      return "Можно сравнивать не более 3 объявлений";
    }
    return null;
  },
  add: (listing) => {
    const { items, has } = get();
    if (has(listing.id)) return { ok: true };

    const sameCategory = items.length === 0 || items[0].category_id === listing.category_id;
    if (!sameCategory) {
      set({ items: [listing] });
      return { ok: true, reason: "category_switched" };
    }

    if (items.length >= MAX) return { ok: false, reason: "max" };
    set((s) => ({ items: [...s.items, listing] }));
    return { ok: true };
  },
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
  has: (id) => get().items.some((i) => i.id === id),
}));
