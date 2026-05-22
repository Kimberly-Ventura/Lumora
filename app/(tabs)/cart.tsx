import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Platform, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCart, removeFromCart, updateQuantity, clearCart, CartItem } from '@/lib/cartHelper';

import { supabase } from '@/lib/supabase';

export default function CartScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const loadCart = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setCartItems([]);
      return;
    }
    const items = await getCart();
    setCartItems(items);
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
    return cartItems.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        alert("You must be logged in to checkout.");
        setIsCheckingOut(false);
        return;
      }

      // 1. Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: userId,
          status: 'pending',
          total_amount: subtotal,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      const orderId = orderData.id;

      // 2. Insert order items
      const orderItems = cartItems.map(item => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
        
        return {
          order_id: orderId,
          product_id: isUUID ? item.id : null,
          quantity: item.quantity,
          unit_price: parsePrice(item.price)
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Success
      await clearCart();
      setCartItems([]);
      alert(`Order placed! Your order ID is #ORD-${orderId.substring(0, 4).toUpperCase()}`);
    } catch (err) {
      console.error(err);
      alert("There was an error placing your order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const renderCartItems = () => {
    return (
      <View style={styles.itemsList}>
        {cartItems.map((item, index) => {
          const itemPriceVal = parsePrice(item.price);
          const itemSubtotal = itemPriceVal * item.quantity;
          
          return (
            <View key={`${item.id}-${item.selectedColor || ''}-${index}`} style={[styles.itemCard, { borderColor: colors.border }]}>
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
                    onPress={() => handleRemoveItem(item.id, item.selectedColor)}
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
            contentContainerStyle={[styles.scrollContent, !isMobile && styles.webScrollContent]}
          >
            <View style={[styles.contentLayout, !isMobile && styles.webLayout]}>
              {/* Left Side: Items List */}
              <View style={[styles.leftColumn, !isMobile && { flex: 1.6 }]}>
                {renderCartItems()}
              </View>

              {/* Right Side: Order Summary Panel */}
              <View style={[styles.rightColumn, !isMobile && { flex: 1, marginLeft: 30 }]}>
                <View style={[styles.summaryCard, { backgroundColor: '#F9F8F6', borderColor: colors.border }]}>
                  <ThemedText style={styles.summaryTitle}>ORDER SUMMARY</ThemedText>
                  
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </ThemedText>
                  </View>

                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Shipping</ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: '#27AE60', fontFamily: 'Inter-SemiBold' }]}>
                      Complimentary
                    </ThemedText>
                  </View>

                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Tax</ThemedText>
                    <ThemedText style={styles.summaryValue}>Calculated at checkout</ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.totalRow}>
                    <ThemedText style={styles.totalLabel}>Estimated Total</ThemedText>
                    <ThemedText style={styles.totalValue}>
                      ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </ThemedText>
                  </View>

                  <Pressable 
                    style={[styles.checkoutButton, { backgroundColor: isCheckingOut ? '#666666' : '#111111' }]}
                    onPress={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    <ThemedText style={styles.checkoutBtnText}>
                      {isCheckingOut ? 'PROCESSING...' : 'PROCEED TO CHECKOUT'}
                    </ThemedText>
                    {!isCheckingOut && <Ionicons name="lock-closed-outline" size={14} color="#FFF" />}
                  </Pressable>

                  <ThemedText style={styles.securityDisclaimer}>
                    Secure payment options verified. Delivery scheduled within 3-5 business days of post-purchase confirmation.
                  </ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>
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
  webScrollContent: {
    alignItems: 'center',
  },
  contentLayout: {
    width: '100%',
    maxWidth: 1200,
  },
  webLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    width: '100%',
  },
  rightColumn: {
    width: '100%',
    marginTop: Spacing.l,
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
  summaryCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
    color: '#111',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
  },
  checkoutButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
  securityDisclaimer: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 16,
  },
});
