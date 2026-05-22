import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AdminTheme } from '@/constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';

// Interfaces
interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  username?: string;
  email?: string;
}

interface Product {
  id: string;
  name: string;
  stock?: number;
}

interface CombinedOrder extends Order {
  username: string;
}

// Config
const STATUS_CONFIG: Record<string, { label: string, bg: string, text: string }> = {
  pending: { label: 'Pending', bg: '#FDF3E1', text: '#D97706' },
  processing: { label: 'Processing', bg: '#E0F2FE', text: '#0284C7' },
  shipped: { label: 'Shipped', bg: '#FAF5ED', text: '#C9A96E' },
  delivered: { label: 'Delivered', bg: '#E6F4EA', text: '#1E4620' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
};

export default function AdminOverviewScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [chartFilter, setChartFilter] = useState<'7d' | '30d' | '90d'>('90d');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, profilesRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, username, email'),
        supabase.from('products').select('id, name, stock')
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  // Set up real-time subscriptions for orders and products
  useEffect(() => {
    const ordersChannel = supabase
      .channel(`orders-changes-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => fetchData()
      )
      .subscribe();

    const productsChannel = supabase
      .channel(`products-changes-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
    };
  }, []);

  // KPIs
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0), [orders]);
  const totalOrders = orders.length;
  const totalCustomers = profiles.length;
  const lowStockProducts = useMemo(() => products.filter(p => p.stock !== undefined && p.stock < 5), [products]);

  // Chart Data (Last 5 Months)
  const chartData = useMemo(() => {
    const months: { label: string, monthKey: string, value: number }[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        monthKey: `${d.getFullYear()}-${d.getMonth()}`,
        value: 0
      });
    }

    orders.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const monthObj = months.find(m => m.monthKey === key);
      if (monthObj) {
        monthObj.value += (Number(o.total_amount) || 0);
      }
    });

    const maxVal = Math.max(...months.map(m => m.value), 1);
    return months.map((m, idx) => ({
      ...m,
      heightPct: (m.value / maxVal) * 100,
      isCurrent: idx === 4
    }));
  }, [orders]);

  // Recent Orders
  const recentOrders: CombinedOrder[] = useMemo(() => {
    return orders.slice(0, 5).map(o => {
      const p = profiles.find(pr => pr.id === o.customer_id);
      return { ...o, username: p?.username || 'Guest' };
    });
  }, [orders, profiles]);

  // Formatters
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return '₱' + (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return '₱' + (val / 1000).toFixed(0) + 'K';
    return '₱' + val.toLocaleString('en-PH', { maximumFractionDigits: 0 });
  };

  const formatFullCurrency = (val: number) => {
    return '₱' + val.toLocaleString('en-PH', { maximumFractionDigits: 0 });
  };

  const getShortId = (id: string) => {
    return `#ORD-${id.substring(0, 4).toUpperCase()}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color={AdminTheme.accent} />
      </View>
    );
  }

  // Common UI blocks
  const KPISection = () => (
    <View style={[styles.kpiContainer, isMobile && styles.kpiContainerMobile]}>
      <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
        <Text style={styles.kpiLabel}>Total revenue</Text>
        <Text style={[styles.kpiValue, { color: AdminTheme.accent }]}>{formatCurrency(totalRevenue)}</Text>
        <Text style={styles.kpiTrend}>↑ 12% this month</Text>
      </View>
      <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
        <Text style={styles.kpiLabel}>Total orders</Text>
        <Text style={styles.kpiValue}>{totalOrders}</Text>
        <Text style={styles.kpiTrend}>↑ 3 this week</Text>
      </View>
      <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
        <Text style={styles.kpiLabel}>Customers</Text>
        <Text style={styles.kpiValue}>{totalCustomers}</Text>
        <Text style={styles.kpiTrend}>+ 1 new today</Text>
      </View>
      <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
        <Text style={styles.kpiLabel}>Low stock items</Text>
        <Text style={[styles.kpiValue, lowStockProducts.length > 0 && { color: '#E65100' }]}>{lowStockProducts.length}</Text>
        <Text style={[styles.kpiTrend, lowStockProducts.length > 0 && { color: '#E65100' }]}>
          {lowStockProducts.length > 0 ? 'Needs restocking' : 'Stock healthy'}
        </Text>
      </View>
    </View>
  );

  const ChartSection = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.sectionTitle}>Revenue by month</Text>
        <View style={styles.filterPills}>
          {['7d', '30d', '90d'].map(pill => (
            <Pressable 
              key={pill} 
              style={[styles.pill, chartFilter === pill && styles.pillActive]}
              onPress={() => setChartFilter(pill as any)}
            >
              <Text style={[styles.pillText, chartFilter === pill && styles.pillTextActive]}>{pill}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.chartArea}>
        <View style={styles.chartBars}>
          {chartData.map((d, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill, 
                  { height: `${Math.max(d.heightPct, 5)}%` },
                  d.isCurrent && styles.barFillCurrent
                ]} />
              </View>
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartAxisLine} />
      </View>
    </View>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
      </View>
    );
  };

  const PanelsSection = () => (
    <View style={[styles.panelsContainer, isMobile && styles.panelsContainerMobile]}>
      {/* Recent Orders Panel */}
      <View style={[styles.panel, isMobile && styles.panelMobile]}>
        <Text style={styles.sectionTitle}>RECENT ORDERS</Text>
        <View style={styles.panelList}>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            recentOrders.map(order => (
              <Pressable 
                key={order.id} 
                style={({ hovered }) => [styles.orderRow, hovered && styles.rowHovered]}
                onPress={() => router.push('/(admin)/orders')}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>{getShortId(order.id)}</Text>
                  <Text style={styles.orderUser}>{order.username}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.orderAmount}>{formatFullCurrency(order.total_amount)}</Text>
                  <StatusBadge status={order.status} />
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>

      {/* Stock Alerts Panel */}
      <View style={[styles.panel, isMobile && styles.panelMobile]}>
        <Text style={styles.sectionTitle}>STOCK ALERTS</Text>
        <ScrollView style={styles.panelList} nestedScrollEnabled>
          {products.length === 0 ? (
            <Text style={styles.emptyText}>No products found</Text>
          ) : (
            products.map(product => {
              const stock = product.stock ?? 0;
              const isLow = stock < 5;
              return (
                <View key={product.id} style={styles.stockRow}>
                  <View style={styles.stockRowLeft}>
                    <View style={[styles.stockDot, isLow ? { backgroundColor: '#E65100' } : { backgroundColor: '#1E4620' }]} />
                    <Text style={styles.stockName}>{product.name}</Text>
                  </View>
                  <Text style={[styles.stockCount, isLow ? { color: '#E65100' } : { color: '#1E4620' }]}>
                    {stock} left
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Mobile Header */}
      {isMobile && (
        <View style={styles.mobileHeader}>
          <View>
            <Text style={styles.mobileHeaderTitle}>Overview</Text>
            <Text style={styles.mobileHeaderSubtitle}>Store performance snapshot</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}>
        
        {/* Desktop Header */}
        {!isMobile && (
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Overview</Text>
            <Text style={styles.pageSubtitle}>Real-time snapshot of your store performance</Text>
          </View>
        )}

        <KPISection />
        <ChartSection />
        <PanelsSection />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AdminTheme.background,
  },
  centerAll: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 40,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
    gap: 24,
  },
  scrollContentMobile: {
    padding: 16,
    gap: 16,
  },
  mobileHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AdminTheme.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mobileHeaderTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 24,
    color: AdminTheme.accent,
  },
  mobileHeaderSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  pageHeader: {
    marginBottom: 8,
  },
  pageTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 32,
    color: AdminTheme.primaryDark,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: AdminTheme.textMuted,
  },
  
  // KPIs
  kpiContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  kpiContainerMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
  },
  kpiCardMobile: {
    minWidth: '46%',
    padding: 16,
  },
  kpiLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: AdminTheme.textMuted,
    marginBottom: 8,
  },
  kpiValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: AdminTheme.textPrimary,
    marginBottom: 8,
  },
  kpiTrend: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#388E3C', // Green for positive trends
  },

  // Chart
  chartContainer: {
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    padding: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3EFE9',
  },
  pillActive: {
    backgroundColor: AdminTheme.accent,
  },
  pillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: AdminTheme.textMuted,
  },
  pillTextActive: {
    color: '#FFF',
  },
  chartArea: {
    height: 220,
    justifyContent: 'flex-end',
    paddingTop: 20,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  barCol: {
    alignItems: 'center',
    height: '100%',
    width: 40,
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: 32,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#F3EBD8',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.3)',
  },
  barFillCurrent: {
    backgroundColor: AdminTheme.accent,
    borderColor: AdminTheme.accent,
  },
  barLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: AdminTheme.textMuted,
  },
  chartAxisLine: {
    position: 'absolute',
    bottom: 24, // above labels
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(43,31,20,0.1)',
    zIndex: 1,
  },

  // Panels
  panelsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  panelsContainerMobile: {
    flexDirection: 'column',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    padding: 24,
    minHeight: 300,
  },
  panelMobile: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: AdminTheme.textMuted,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  panelList: {
    gap: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
  },
  rowHovered: {
    backgroundColor: 'rgba(201,169,110,0.03)',
  },
  orderId: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: AdminTheme.textPrimary,
  },
  orderUser: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: AdminTheme.textMuted,
    marginTop: 2,
  },
  orderAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: AdminTheme.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
  },
  stockRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: AdminTheme.textPrimary,
  },
  stockCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: AdminTheme.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
});
