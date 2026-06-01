import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { Listing } from "@/types";

export interface RecentItem {
  id: string;
  title: string;
  price: number;
  city: string;
  image_url: string | null;
  category_name: string;
  viewed_at: string;
}

const KEY = "recently_viewed";
const MAX = 10;

async function readRaw(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function writeRaw(raw: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(KEY, raw);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, raw);
  } catch {
    /* ignore */
  }
}

export async function getRecentlyViewed(): Promise<RecentItem[]> {
  const raw = await readRaw();
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecentItem[];
  } catch {
    return [];
  }
}

export async function saveRecentlyViewed(listing: Listing): Promise<void> {
  const existing = (await getRecentlyViewed()).filter((i) => i.id !== listing.id);
  const item: RecentItem = {
    id: listing.id,
    title: listing.title,
    price: Number(listing.price),
    city: listing.city,
    image_url: listing.images[0]?.image_url ?? null,
    category_name: listing.category.name,
    viewed_at: new Date().toISOString(),
  };
  const updated = [item, ...existing].slice(0, MAX);
  await writeRaw(JSON.stringify(updated));
}
