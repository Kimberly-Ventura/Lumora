import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@lumora_cart_items';

export interface CartItem {
  id: string;
  name: string;
  brand?: string;
  price: string;
  image: any;
  category?: string;
  quantity: number;
  selectedColor?: string;
}

export async function getCart(): Promise<CartItem[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(CART_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error fetching cart', e);
    return [];
  }
}

export async function saveCart(items: CartItem[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(items);
    await AsyncStorage.setItem(CART_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving cart', e);
  }
}

export async function addToCart(product: Omit<CartItem, 'quantity'>, quantity: number = 1): Promise<CartItem[]> {
  const currentList = await getCart();
  const existingIndex = currentList.findIndex(
    item => item.id === product.id && item.selectedColor === product.selectedColor
  );

  let newList: CartItem[];
  if (existingIndex > -1) {
    newList = [...currentList];
    newList[existingIndex].quantity += quantity;
  } else {
    newList = [...currentList, { ...product, quantity }];
  }
  await saveCart(newList);
  return newList;
}

export async function removeFromCart(id: string, selectedColor?: string): Promise<CartItem[]> {
  const currentList = await getCart();
  const newList = currentList.filter(
    item => !(item.id === id && item.selectedColor === selectedColor)
  );
  await saveCart(newList);
  return newList;
}

export async function updateQuantity(id: string, quantity: number, selectedColor?: string): Promise<CartItem[]> {
  const currentList = await getCart();
  const existingIndex = currentList.findIndex(
    item => item.id === id && item.selectedColor === selectedColor
  );
  if (existingIndex > -1) {
    const newList = [...currentList];
    newList[existingIndex].quantity = quantity;
    if (quantity <= 0) {
      return removeFromCart(id, selectedColor);
    }
    await saveCart(newList);
    return newList;
  }
  return currentList;
}

export async function clearCart(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CART_KEY);
  } catch (e) {
    console.error('Error clearing cart', e);
  }
}

export async function clearSelectedFromCart(selectedKeys: string[]): Promise<void> {
  try {
    const currentList = await getCart();
    const newList = currentList.filter(item => {
      const itemKey = `${item.id}-${item.selectedColor || ''}`;
      return !selectedKeys.includes(itemKey);
    });
    await saveCart(newList);
  } catch (e) {
    console.error('Error clearing selected from cart', e);
  }
}

export async function updateCartItem(id: string, oldColor: string | undefined, updatedFields: Partial<CartItem>): Promise<CartItem[]> {
  const currentList = await getCart();
  const existingIndex = currentList.findIndex(
    item => item.id === id && item.selectedColor === oldColor
  );
  if (existingIndex > -1) {
    const newList = [...currentList];
    newList[existingIndex] = { ...newList[existingIndex], ...updatedFields };
    
    // Merge duplicates if the updated item color matches another existing item in the cart!
    const duplicatesIndex = newList.findIndex(
      (item, idx) => idx !== existingIndex && item.id === id && item.selectedColor === updatedFields.selectedColor
    );
    if (duplicatesIndex > -1) {
      newList[duplicatesIndex].quantity += newList[existingIndex].quantity;
      newList.splice(existingIndex, 1);
    }
    await saveCart(newList);
    return newList;
  }
  return currentList;
}
