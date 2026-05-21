import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_KEY = '@lumora_wishlist_items';

export interface WishlistItem {
  id: string;
  name: string;
  brand?: string;
  price: string;
  image: any;
  rating?: string | number;
  category?: string;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(WISHLIST_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error fetching wishlist', e);
    return [];
  }
}

export async function saveWishlist(items: WishlistItem[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(items);
    await AsyncStorage.setItem(WISHLIST_KEY, jsonValue);
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
