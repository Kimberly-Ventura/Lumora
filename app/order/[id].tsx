import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  products?: { name: string; image_url: string };
}

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  tracking_number?: string;
  order_items?: OrderItem[];
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      fetchOrderDetails(id as string);

      const channel = supabase
        .channel(`order_detail_${id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${id}`,
          },
          (_payload) => {
            fetchOrderDetails(id as string);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [id])
  );

  const fetchOrderDetails = async (orderId: string) => {
    try {
      // 1. Fetch Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;

      // 2. Fetch Order Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
        
      if (itemsError) throw itemsError;

      // 3. Fetch Products for items
      const productIds = itemsData.map(item => item.product_id).filter(Boolean);
      let productsMap: Record<string, any> = {};
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, image_url')
          .in('id', productIds);
        if (productsData) {
          productsMap = Object.fromEntries(productsData.map(p => [p.id, p]));
        }
      }

      const orderItemsWithProducts = itemsData.map(item => ({
        ...item,
        products: productsMap[item.product_id] || { name: 'Unknown Product', image_url: null }
      }));

      setOrder({
        ...orderData,
        order_items: orderItemsWithProducts
      });

    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No, Keep It', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
               // 1. Update order status
               const { error: updateError } = await supabase
                 .from('orders')
                 .update({ status: 'cancelled' })
                 .eq('id', order.id);
                 
               if (updateError) throw updateError;

               // 1.5. Stock restoration and admin cancellation alerts are now handled
               // automatically at the database level by the 'trg_order_status_updated' trigger.
               // This prevents duplicate triggers and RLS errors on the client!
               
               // 2. Insert customer notification
               const shortId = getShortId(order.id);
               await supabase.from('customer_notifications').insert({
                 user_id: order.customer_id,
                 type: 'order_update',
                 title: 'Order Cancelled',
                 description: `You have successfully cancelled your order ${shortId}.`,
                 is_read: false
               });
              
              // 4. Re-fetch to get updated state
              await fetchOrderDetails(order.id);
            } catch (err) {
              console.error('Error cancelling order:', err);
              Alert.alert('Error', 'Failed to cancel the order. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (val: number) => {
    return '₱' + val.toLocaleString('en-PH', { maximumFractionDigits: 0 });
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getShortId = (id: string) => `#ORD-${id.substring(0, 4).toUpperCase()}`;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#8A5E00';
      case 'processing': return '#1A3F8A';
      case 'shipped': return '#7A4F00';
      case 'delivered': return '#1B5E1B';
      case 'cancelled': return '#A1261B';
      default: return colors.text;
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case 'pending': return '#FFF3DC';
      case 'processing': return '#DCE8FF';
      case 'shipped': return '#F3EBD8';
      case 'delivered': return '#E2F5E2';
      case 'cancelled': return '#FDEAE8';
      default: return '#EAE4DC';
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ThemedText>Order not found.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>ORDER DETAILS</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topSection}>
          <ThemedText style={styles.orderId}>{getShortId(order.id)}</ThemedText>
          <ThemedText style={styles.orderDate}>{formatDate(order.created_at)}</ThemedText>
        </View>

        <View style={styles.statusBox}>
          <ThemedText style={styles.sectionLabel}>Order Status</ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </ThemedText>
          </View>
          
          {order.tracking_number && (
            <View style={styles.trackingBox}>
              <Ionicons name="cube-outline" size={16} color={colors.text} />
              <ThemedText style={styles.trackingText}>Tracking: {order.tracking_number}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.itemsSection}>
          <ThemedText style={styles.sectionTitle}>Items ({order.order_items?.length || 0})</ThemedText>
          {order.order_items?.map((item, idx) => {
            const hasProduct = item.products?.name && item.products.name !== 'Unknown Product';
            return (
              <View key={item.id || idx} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <View style={styles.itemImageContainer}>
                  {item.products?.image_url ? (
                    <Image source={{ uri: item.products.image_url }} style={styles.itemImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name="cube-outline" size={24} color="#C9A96E" />
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <ThemedText style={styles.itemName}>
                    {hasProduct ? item.products!.name : `Item ${idx + 1}`}
                  </ThemedText>
                  <ThemedText style={styles.itemMeta}>Qty: {item.quantity}  ×  {formatCurrency(item.unit_price)}</ThemedText>
                </View>
                <ThemedText style={styles.itemTotal}>{formatCurrency(item.quantity * item.unit_price)}</ThemedText>
              </View>
            );
          })}
        </View>

        <View style={[styles.summaryBox, { backgroundColor: '#F9F8F6' }]}>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatCurrency(order.total_amount)}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Shipping</ThemedText>
            <ThemedText style={styles.summaryValue}>Complimentary</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>{formatCurrency(order.total_amount)}</ThemedText>
          </View>
        </View>

        {(order.status === 'pending' || order.status === 'processing') && (
          <Pressable 
            style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.8 : 1 }]} 
            onPress={cancelOrder}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel Order</ThemedText>
          </Pressable>
        )}
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
  content: {
    padding: Spacing.m,
    paddingBottom: 40,
    gap: 24,
  },
  topSection: {
    alignItems: 'center',
    gap: 4,
  },
  orderId: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  orderDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  statusBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  trackingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  trackingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  itemsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0EBE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '80%',
    height: '80%',
  },
  itemDetails: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  itemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  itemMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#666',
  },
  itemTotal: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  summaryBox: {
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  totalValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDEAE8',
    backgroundColor: '#FFF5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#A1261B',
  }
});
