import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Platform, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCart, removeFromCart, updateQuantity, clearCart, CartItem } from '@/lib/cartHelper';
import { Skeleton } from '@/components/Skeleton';
import { supabase } from '@/lib/supabase';

export default function CartScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setCartItems([]);
        setSelectedKeys([]);
        return;
      }
      const items = await getCart();
      setCartItems(items);
      // Auto-select all items on load
      setSelectedKeys(items.map(item => `${item.id}-${item.selectedColor || ''}`));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (id: string, newQty: number, selectedColor?: string) => {
    const updatedList = await updateQuantity(id, newQty, selectedColor);
    setCartItems(updatedList);
  };

  const handleRemoveItem = async (id: string, selectedColor?: string) => {
    const updatedList = await removeFromCart(id, selectedColor);
    setCartItems(updatedList);
  };

  // Helper to parse price string like "$2,490" to number 2490
  const parsePrice = (priceStr: string): number => {
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  const calculateSubtotal = () => {
    return cartItems
      .filter(item => selectedKeys.includes(`${item.id}-${item.selectedColor || ''}`))
      .reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();

  const handleCheckout = () => {
    if (selectedKeys.length === 0) {
      alert("Please select at least one item to checkout.");
      return;
    }
    router.push({
      pathname: '/checkout',
      params: { selectedKeys: JSON.stringify(selectedKeys) }
    });
  };

  const renderCartItems = () => {
    if (isLoading) {
      return (
        <View style={styles.itemsList}>
          {[1, 2, 3].map(key => (
            <View key={`skeleton-${key}`} style={[styles.itemCard, { borderColor: colors.border, padding: 16 }]}>
              <View style={styles.itemCheckbox}>
                <Skeleton width={20} height={20} borderRadius={10} />
              </View>
              <View style={styles.imageContainer}>
                <Skeleton width="100%" height="100%" borderRadius={8} />
              </View>
              <View style={styles.detailsContainer}>
                <Skeleton width="80%" height={16} style={{ marginBottom: 12 }} />
                <Skeleton width="40%" height={14} style={{ marginBottom: 16 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton width={60} height={18} />
                  <Skeleton width={80} height={32} borderRadius={16} />
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.itemsList}>
        {/* Select All Row */}
        {cartItems.length > 0 && (
          <View style={styles.selectAllRow}>
            <Pressable 
              style={styles.checkboxContainer}
              onPress={() => {
                if (selectedKeys.length === cartItems.length) {
                  setSelectedKeys([]); // Deselect all
                } else {
                  setSelectedKeys(cartItems.map(item => `${item.id}-${item.selectedColor || ''}`)); // Select all
                }
              }}
            >
              <View style={[styles.checkbox, selectedKeys.length === cartItems.length && styles.checkboxActive]}>
                {selectedKeys.length === cartItems.length && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <ThemedText style={styles.selectAllText}>
                Select All Items ({cartItems.length})
              </ThemedText>
            </Pressable>
          </View>
        )}

        {cartItems.map((item, index) => {
          const itemKey = `${item.id}-${item.selectedColor || ''}`;
          const isSelected = selectedKeys.includes(itemKey);
          
          return (
            <View key={`${itemKey}-${index}`} style={[styles.itemCard, { borderColor: colors.border }]}>
              {/* Checkbox */}
              <Pressable 
                style={styles.itemCheckbox}
                onPress={() => {
                  if (isSelected) {
                    setSelectedKeys(prev => prev.filter(k => k !== itemKey));
                  } else {
                    setSelectedKeys(prev => [...prev, itemKey]);
                  }
                }}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </Pressable>

              {/* Product Thumbnail (Pressable to Edit) */}
              <Pressable 
                onPress={() => router.push(`/product/${item.id}?editMode=true&editColor=${encodeURIComponent(item.selectedColor || '')}` as any)}
                style={styles.imageContainer}
              >
                <Image source={item.image} style={styles.productImage} resizeMode="contain" />
              </Pressable>

              {/* Main Content Area */}
              <View style={styles.detailsContainer}>
                {/* Top Row: Name and Delete Icon */}
                <View style={styles.detailsHeader}>
                  <Pressable 
                    onPress={() => router.push(`/product/${item.id}?editMode=true&editColor=${encodeURIComponent(item.selectedColor || '')}` as any)}
                    style={{ flex: 1, marginRight: 8 }}
                  >
                    <ThemedText style={styles.productName}>
                      {item.name}
                    </ThemedText>
                  </Pressable>
                    <Pressable 
                      onPress={() => {
                        handleRemoveItem(item.id, item.selectedColor);
                        // Also remove from selected keys if it was selected
                        setSelectedKeys(prev => prev.filter(k => k !== itemKey));
                      }}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                    </Pressable>
                </View>

                {/* Middle Row: Brand & Swatch Badge */}
                <View style={styles.metaRow}>
                  <ThemedText style={styles.productBrand}>
                    {item.brand || 'Lumora Luxe'}
                  </ThemedText>
                  {item.selectedColor && (
                    <View style={styles.colorBadge}>
                      <View style={[styles.colorDot, { backgroundColor: item.selectedColor }]} />
                      <ThemedText style={styles.colorText}>Custom</ThemedText>
                    </View>
                  )}
                </View>

                {/* Bottom Row: Price & Quantity Controls */}
                <View style={styles.bottomRow}>
                  <ThemedText style={styles.unitPrice}>
                    {item.quantity > 1 ? `${item.price} × ${item.quantity}` : item.price}
                  </ThemedText>
                  
                  <View style={styles.quantityControls}>
                    <Pressable 
                      onPress={() => handleUpdateQuantity(item.id, item.quantity - 1, item.selectedColor)}
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                    >
                      <Ionicons name="remove-outline" size={14} color={colors.text} />
                    </Pressable>
                    <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                    <Pressable 
                      onPress={() => handleUpdateQuantity(item.id, item.quantity + 1, item.selectedColor)}
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                    >
                      <Ionicons name="add-outline" size={14} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.push('/product-list' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>MY BAG ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {cartItems.length === 0 ? (
        /* Empty State */
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={72} color={colors.icon} />
          <ThemedText style={styles.emptyTitle}>Your bag is empty</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Add pieces from our collection to begin your curation.
          </ThemedText>
          <Pressable
            style={[styles.shopButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/product-list' as any)}
          >
            <ThemedText style={[styles.shopButtonText, { color: colors.background }]}>
              EXPLORE COLLECTION
            </ThemedText>
          </Pressable>
        </ScrollView>
      ) : (
        /* Cart List and Summary Checkout */
        <View style={{ flex: 1 }}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent]}
          >
            <View style={styles.contentLayout}>
              {renderCartItems()}
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar for simple Cart Total & Checkout */}
          <View style={[styles.stickyBottomBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <View style={styles.bottomBarContent}>
              <View style={styles.totalContainer}>
                <ThemedText style={styles.cartTotalLabel}>Selected ({selectedKeys.length})</ThemedText>
                <ThemedText style={styles.cartTotalValue}>
                  ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </ThemedText>
              </View>
              <Pressable 
                style={[
                  styles.proceedButton, 
                  { backgroundColor: selectedKeys.length > 0 ? '#111111' : '#666' }
                ]}
                onPress={handleCheckout}
                disabled={selectedKeys.length === 0}
              >
                <ThemedText style={styles.proceedButtonText}>
                  PROCEED TO CHECKOUT
                </ThemedText>
                <Ionicons name="arrow-forward-outline" size={16} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingTop: 60,
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: {
    ...Typography.cardTitle,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  placeholder: { width: 30 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.s,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginTop: Spacing.s,
  },
  emptySubtitle: {
    ...Typography.bodyText,
    textAlign: 'center',
    lineHeight: 22,
  },
  shopButton: {
    marginTop: Spacing.m,
    paddingVertical: 14,
    paddingHorizontal: Spacing.l,
    borderRadius: 2,
  },
  shopButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 2,
  },
  scrollContent: {
    padding: Spacing.m,
    paddingBottom: 40,
  },
  contentLayout: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  selectAllRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F8F6',
    borderRadius: 12,
    marginBottom: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  selectAllText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  itemCheckbox: {
    padding: 8,
    marginRight: 8,
  },
  itemsList: {
    gap: 16,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  imageContainer: {
    width: 90,
    height: 90,
    backgroundColor: '#F9F8F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '85%',
    height: '85%',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    minHeight: 90,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#111',
    lineHeight: 18,
  },
  productBrand: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  colorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EBE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#655E56',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  unitPrice: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    minWidth: 16,
    textAlign: 'center',
  },
  subtotalText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#111',
  },
  stickyBottomBar: {
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: Spacing.m,
  },
  bottomBarContent: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  cartTotalLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  cartTotalValue: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
    marginTop: 2,
  },
  proceedButton: {
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  proceedButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
});
