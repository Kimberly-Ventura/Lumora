import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCart, clearSelectedFromCart, CartItem } from '@/lib/cartHelper';
import { supabase } from '@/lib/supabase';

export default function CheckoutScreen() {
  const router = useRouter();
  const { selectedKeys } = useLocalSearchParams<{ selectedKeys?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [loading, setLoading] = useState(true);

  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, GCash, Credit Card

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      alert("You must be logged in to checkout.");
      router.replace('/(tabs)/profile');
      return;
    }
    let items = await getCart();
    
    if (selectedKeys) {
      try {
        const parsedKeys = JSON.parse(selectedKeys) as string[];
        items = items.filter(item => parsedKeys.includes(`${item.id}-${item.selectedColor || ''}`));
      } catch (e) {
        console.error("Failed to parse selected keys", e);
      }
    }

    if (items.length === 0) {
      router.replace('/(tabs)/cart');
      return;
    }
    setCartItems(items);
    
    // Optionally pre-fill address from profile if it exists
    const { data: profile } = await supabase.from('profiles').select('address').eq('id', data.session.user.id).single();
    if (profile?.address) {
      setShippingAddress(profile.address);
    }
    setLoading(false);
  };

  const parsePrice = (priceStr: string): number => {
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      alert("Please enter a shipping address.");
      return;
    }

    setIsCheckingOut(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        alert("Session expired. Please log in again.");
        setIsCheckingOut(false);
        return;
      }

      // 1. Insert order
      const orderPayload: any = {
        customer_id: userId,
        status: 'pending',
        total_amount: subtotal,
        shipping_address: shippingAddress,
      };

      // Add payment method with a fallback handler in case the migration hasn't run
      orderPayload.payment_method = paymentMethod;

      let insertRes = await supabase.from('orders').insert([orderPayload]).select('id').single();
      
      if (insertRes.error && (insertRes.error.code === '42703' || insertRes.error.code === 'PGRST204')) {
        // Fallback if payment_method column is missing or schema cache is stale
        const fallbackPayload = { ...orderPayload };
        delete fallbackPayload.payment_method;
        insertRes = await supabase.from('orders').insert([fallbackPayload]).select('id').single();
      }

      if (insertRes.error) throw insertRes.error;
      const orderId = insertRes.data.id;

      // 2. Insert order items
      const orderItems = cartItems.map(item => {
        let prodId = item.id;
        if (item.id === '1') prodId = '72e6a401-9e14-4808-bf61-4d068fde5e2f'; // Verona Luxe Sofa
        if (item.id === '2') prodId = 'a53a251b-6354-4131-8657-79572408546a'; // Vero Modular Chair
        if (item.id === '3') prodId = '5ea7ddfc-8327-4df1-9a19-da1821bb4c28'; // Rustic Seat Bar Stool
        if (item.id === '4') prodId = '1dde8d00-5334-4e09-b6a1-f7659b102add'; // Nova Line Lamp
        if (item.id === '5') prodId = '53dcba60-8399-413d-a070-08400ada89d1'; // Aurelius Lounge Chair
        if (item.id === '6') prodId = '7d37a104-f9f1-42bb-bb51-e6b555e83199'; // Nordic Dining Table

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prodId);
        
        return {
          order_id: orderId,
          product_id: isUUID ? prodId : null,
          quantity: item.quantity,
          unit_price: parsePrice(item.price)
        };
      });

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Success -> Clear only selected items from Cart
      if (selectedKeys) {
        try {
          const parsedKeys = JSON.parse(selectedKeys) as string[];
          await clearSelectedFromCart(parsedKeys);
        } catch (e) {
          console.error("Failed to parse selected keys for clearing", e);
        }
      }
      setCartItems([]);

      // 4. Notifications
      let customerName = 'Customer';
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).single();
      if (profile && profile.username) {
        customerName = profile.username;
      }

      const shortId = `#ORD-${orderId.substring(0, 4).toUpperCase()}`;

      await supabase.from('customer_notifications').insert({
        user_id: userId,
        type: 'order_update',
        title: 'Order Placed',
        description: `Your order ${shortId} is pending.`,
        is_read: false
      });

      await supabase.rpc('insert_admin_notification', {
        p_type: 'new_order',
        p_title: 'New Order Placed',
        p_description: `New order ${shortId} received from ${customerName}`
      });

      // 5. Navigate to confirmation
      router.replace({
        pathname: '/order-confirmation',
        params: { orderId: shortId }
      });

    } catch (err) {
      console.error(err);
      alert("There was an error placing your order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>CHECKOUT</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, !isMobile && styles.webScrollContent]}
      >
        <View style={[styles.contentLayout, !isMobile && styles.webLayout]}>
          {/* Left Side: Forms */}
          <View style={[styles.leftColumn, !isMobile && { flex: 1.6 }]}>
            
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>SHIPPING ADDRESS</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your full delivery address (Street, City, Province, Zip)"
                placeholderTextColor="#999"
                value={shippingAddress}
                onChangeText={setShippingAddress}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>PAYMENT METHOD</ThemedText>
              <View style={styles.paymentOptions}>
                {['COD', 'GCash', 'Credit Card'].map((method) => (
                  <Pressable 
                    key={method}
                    style={[
                      styles.paymentOption, 
                      { borderColor: colors.border },
                      paymentMethod === method && styles.paymentOptionActive
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Ionicons 
                      name={paymentMethod === method ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={paymentMethod === method ? '#111' : '#999'} 
                    />
                    <ThemedText style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>
                      {method === 'COD' ? 'Cash on Delivery (COD)' : method}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

          </View>

          {/* Right Side: Order Summary */}
          <View style={[styles.rightColumn, !isMobile && { flex: 1, marginLeft: 30 }]}>
            <View style={[styles.summaryCard, { backgroundColor: '#F9F8F6', borderColor: colors.border }]}>
              <ThemedText style={styles.summaryTitle}>ORDER SUMMARY</ThemedText>
              
              <View style={styles.itemsPreview}>
                {cartItems.map((item, index) => (
                  <View key={index} style={styles.previewItemRow}>
                    <ThemedText style={styles.previewItemName} numberOfLines={1}>
                      {item.quantity}x {item.name}
                    </ThemedText>
                    <ThemedText style={styles.previewItemPrice}>
                      ₱{(parsePrice(item.price) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Total</ThemedText>
                <ThemedText style={styles.totalValue}>
                  ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </ThemedText>
              </View>

              <Pressable 
                style={[styles.checkoutButton, { backgroundColor: isCheckingOut ? '#666666' : '#111111' }]}
                onPress={handlePlaceOrder}
                disabled={isCheckingOut}
              >
                <ThemedText style={styles.checkoutBtnText}>
                  {isCheckingOut ? 'PROCESSING...' : 'PLACE ORDER'}
                </ThemedText>
                {!isCheckingOut && <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1.5,
    color: '#111',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFF',
    gap: 12,
  },
  paymentOptionActive: {
    borderColor: '#111',
    backgroundColor: '#FAFAFA',
  },
  paymentText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  paymentTextActive: {
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
  itemsPreview: {
    gap: 12,
  },
  previewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewItemName: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#666',
    flex: 1,
    marginRight: 16,
  },
  previewItemPrice: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
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
});
