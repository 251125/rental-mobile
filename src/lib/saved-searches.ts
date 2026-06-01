import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ListingFilters } from "@/types";

export interface SavedSearch {
  id: string;
  label: string;
  filters: ListingFilters;
  saved_at: string;
}

const KEY = "saved_searches";
const MAX = 12;

async function read(): Promise<string | null> {
  if (Platform.OS === "web") {
    try { return localStorage.getItem(KEY); } catch { return null; }
  }
  try { return await SecureStore.getItemAsync(KEY); } catch { return null; }
}

async function write(raw: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.setItem(KEY, raw); } catch { /* ignore */ }
    return;
  }
  try { await SecureStore.setItemAsync(KEY, raw); } catch { /* ignore */ }
}

function searchKey(f: ListingFilters): string {
  return JSON.stringify({
    s: f.search ?? "",
    c: f.city ?? "",
    pm: f.price_min ?? null,
    px: f.price_max ?? null,
    cat: f.category_ids?.slice().sort() ?? [],
    sb: f.sortBy ?? "",
    so: f.sortOrder ?? "",
  });
}

function makeLabel(f: ListingFilters): string {
  const parts = [
    f.search,
    f.city,
    f.price_min !== undefined ? `от ${f.price_min} ₸` : null,
    f.price_max !== undefined ? `до ${f.price_max} ₸` : null,
  ].filter(Boolean) as string[];
  return parts.join(" • ") || "Все объявления";
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const raw = await read();
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedSearch[];
  } catch {
    return [];
  }
}

export async function saveSearch(filters: ListingFilters): Promise<boolean> {
  const existing = await getSavedSearches();
  const key = searchKey(filters);
  if (existing.some((s) => searchKey(s.filters) === key)) return false;
  const item: SavedSearch = {
    id: `${Date.now()}`,
    label: makeLabel(filters),
    filters: { ...filters, page: 1 },
    saved_at: new Date().toISOString(),
  };
  const updated = [item, ...existing].slice(0, MAX);
  await write(JSON.stringify(updated));
  return true;
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const remaining = (await getSavedSearches()).filter((s) => s.id !== id);
  await write(JSON.stringify(remaining));
}
