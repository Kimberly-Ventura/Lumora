import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Build a user-specific key so wishlists are NEVER shared between accounts.
const getWishlistKey = (userId: string) => `@lumora_wishlist_${userId}`;

// Fallback global key (legacy) — used only during migration / guest sessions.
const LEGACY_KEY = '@lumora_wishlist_items';

export interface WishlistItem {
  id: string;
  name: string;
  brand?: string;
  price: string;
  image: any;
  rating?: string | number;
  category?: string;
}

/** Returns the currently logged-in user's ID, or null if not signed in. */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getWishlist(): Promise<WishlistItem[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return []; // Always empty for unauthenticated users

    const key = getWishlistKey(userId);
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error fetching wishlist', e);
    return [];
  }
}

export async function saveWishlist(items: WishlistItem[]): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return; // Don't save if not logged in

    const key = getWishlistKey(userId);
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving wishlist', e);
  }
}

export async function addToWishlist(product: WishlistItem): Promise<WishlistItem[]> {
  const currentList = await getWishlist();
  if (currentList.some(item => item.id === product.id)) {
    return currentList; // already exists
  }
  const newList = [...currentList, product];
  await saveWishlist(newList);
  return newList;
}

export async function removeFromWishlist(id: string): Promise<WishlistItem[]> {
  const currentList = await getWishlist();
  const newList = currentList.filter(item => item.id !== id);
  await saveWishlist(newList);
  return newList;
}

export async function isFavorite(id: string): Promise<boolean> {
  const currentList = await getWishlist();
  return currentList.some(item => item.id === id);
}

/**
 * Clears the wishlist for a specific user from local storage.
 * Call this on sign-out to prevent wishlist bleed to the next user.
 */
export async function clearWishlistForUser(userId: string): Promise<void> {
  try {
    const key = getWishlistKey(userId);
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error clearing wishlist', e);
  }
}
