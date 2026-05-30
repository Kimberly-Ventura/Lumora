import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/Skeleton';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product_id: string;
  products?: { name: string; image_url: string | null };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();

      const channel = supabase
        .channel(`order_history_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      // 1. Fetch orders
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!ordersData || ordersData.length === 0) { setOrders([]); return; }

      // 2. Fetch order items for all orders
      const orderIds = ordersData.map(o => o.id);
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, unit_price')
        .in('order_id', orderIds);

      // 3. Fetch product names for all items
      let productsMap: Record<string, { name: string; image_url: string | null }> = {};
      if (itemsData && itemsData.length > 0) {
        const productIds = [...new Set(itemsData.map(i => i.product_id).filter(Boolean))];
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name, image_url')
            .in('id', productIds);
          if (productsData) {
            productsMap = Object.fromEntries(productsData.map(p => [p.id, { name: p.name, image_url: p.image_url }]));
          }
        }
      }

      // 4. Group items by order
      const itemsByOrder: Record<string, OrderItem[]> = {};
      if (itemsData) {
        itemsData.forEach(item => {
          if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
          itemsByOrder[item.order_id].push({
            ...item,
            products: productsMap[item.product_id] || null,
          });
        });
      }

      setOrders(ordersData.map(o => ({ ...o, order_items: itemsByOrder[o.id] || [] })));
    } catch (err) {
      console.error('Error fetching order history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getShortId = (id: string) => `#ORD-${id.substring(0, 4).toUpperCase()}`;
  const formatCurrency = (val: number) => '₱' + val.toLocaleString('en-PH', { maximumFractionDigits: 0 });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#8A5E00';
      case 'processing': return '#1A3F8A';
      case 'shipped': return '#7A4F00';
      case 'delivered': return '#1B5E1B';
      case 'cancelled': return '#A1261B';
      default: return colors.text;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pending': return '#FFF3DC';
      case 'processing': return '#DCE8FF';
      case 'shipped': return '#F3EBD8';
      case 'delivered': return '#E2F5E2';
      case 'cancelled': return '#FDEAE8';
      default: return '#EAE4DC';
    }
  };

  const getItemSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return 'No items';
    const names = items
      .map(i => i.products?.name)
      .filter(Boolean)
      .slice(0, 2);
    if (names.length === 0) return `${items.length} item${items.length !== 1 ? 's' : ''}`;
    const extra = items.length > 2 ? ` +${items.length - 2} more` : '';
    return names.join(', ') + extra;
  };

  const getFirstImage = (items: OrderItem[]) => {
    return items?.find(i => i.products?.image_url)?.products?.image_url || null;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>ORDER HISTORY</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {[1, 2, 3, 4].map(key => (
            <View key={`skeleton-${key}`} style={[styles.orderCard, { borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={[styles.thumbnail, { backgroundColor: 'transparent' }]}>
                  <Skeleton width="100%" height="100%" borderRadius={10} />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTopRow}>
                    <Skeleton width={80} height={14} />
                    <Skeleton width={60} height={18} borderRadius={12} />
                  </View>
                  <Skeleton width="70%" height={12} style={{ marginTop: 4, marginBottom: 8 }} />
                  <View style={styles.cardBottomRow}>
                    <Skeleton width={90} height={12} />
                    <Skeleton width={60} height={16} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={48} color={colors.icon} />
          <ThemedText style={styles.emptyTitle}>No Orders Found</ThemedText>
          <ThemedText style={styles.emptySubtitle}>You haven't placed any orders yet.</ThemedText>
          <Pressable style={[styles.shopButton, { backgroundColor: colors.tint }]} onPress={() => router.push('/product-list' as any)}>
            <ThemedText style={[styles.shopButtonText, { color: colors.background }]}>EXPLORE COLLECTION</ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {orders.map((order) => {
            const items = order.order_items || [];
            const firstImage = getFirstImage(items);
            const itemCount = items.length;
            return (
              <Pressable
                key={order.id}
                style={({ pressed }) => [styles.orderCard, { borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => router.push(`/order/${order.id}` as any)}
              >
                <View style={styles.cardRow}>
                  {/* Product thumbnail */}
                  <View style={styles.thumbnail}>
                    {firstImage ? (
                      <Image source={{ uri: firstImage }} style={styles.thumbImage} resizeMode="contain" />
                    ) : (
                      <Ionicons name="cube-outline" size={28} color="#C9A96E" />
                    )}
                  </View>

                  {/* Order info */}
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTopRow}>
                      <ThemedText style={styles.orderId}>{getShortId(order.id)}</ThemedText>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
                        <ThemedText style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedText style={styles.itemSummary} numberOfLines={1}>{getItemSummary(items)}</ThemedText>

                    <View style={styles.cardBottomRow}>
                      <ThemedText style={styles.orderDate}>{formatDate(order.created_at)}</ThemedText>
                      <ThemedText style={styles.orderTotal}>{formatCurrency(order.total_amount)}</ThemedText>
                    </View>

                    {itemCount > 0 && (
                      <ThemedText style={styles.itemCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</ThemedText>
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={16} color="#C8BAA8" style={{ marginLeft: 4 }} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
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
  listContent: {
    padding: Spacing.m,
    gap: 12,
  },
  orderCard: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FAF7F2',
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F0EBE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  thumbImage: {
    width: '85%',
    height: '85%',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  itemSummary: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#555',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  orderDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#999',
  },
  orderTotal: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#2B1F14',
  },
  itemCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#B0A090',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    gap: Spacing.s,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: Spacing.m,
  },
  shopButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  shopButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
});
