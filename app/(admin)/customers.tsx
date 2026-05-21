import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, TextInput, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AdminTheme } from '@/constants/theme';

interface Profile {
  id: string;
  username?: string;
  email?: string;
  created_at?: string;
}

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface CustomerStat {
  profile: Profile;
  orderCount: number;
  ltv: number;
  orders: Order[];
  lastOrderDate: string | null;
}

const STATUS_CONFIG: Record<string, { label: string, bg: string, text: string }> = {
  pending: { label: 'Pending', bg: '#FDF3E1', text: '#D97706' },
  processing: { label: 'Processing', bg: '#E0F2FE', text: '#0284C7' },
  shipped: { label: 'Shipped', bg: '#FAF5ED', text: '#C9A96E' },
  delivered: { label: 'Delivered', bg: '#E6F4EA', text: '#1E4620' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
};

export default function AdminCustomersScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  const [customerStats, setCustomerStats] = useState<CustomerStat[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerStat | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false })
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const profiles: Profile[] = profilesRes.data || [];
      const orders: Order[] = ordersRes.data || [];

      const stats = profiles.map(profile => {
        const userOrders = orders.filter(o => o.customer_id === profile.id);
        const ltv = userOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        const lastOrderDate = userOrders.length > 0 ? userOrders[0].created_at : null;

        return {
          profile,
          orderCount: userOrders.length,
          ltv,
          orders: userOrders,
          lastOrderDate
        };
      });

      // Sort by order count descending
      stats.sort((a, b) => b.orderCount - a.orderCount);
      setCustomerStats(stats);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const s = search.toLowerCase();
    return customerStats.filter(c => {
      const uname = (c.profile.username || 'guest').toLowerCase();
      const email = (c.profile.email || '-').toLowerCase();
      return uname.includes(s) || email.includes(s);
    });
  }, [customerStats, search]);

  const globalStats = useMemo(() => {
    return {
      totalCustomers: customerStats.length,
      totalOrders: customerStats.reduce((sum, c) => sum + c.orderCount, 0),
      totalRevenue: customerStats.reduce((sum, c) => sum + c.ltv, 0),
    };
  }, [customerStats]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return '₱' + (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return '₱' + (val / 1000).toFixed(0) + 'K';
    }
    return '₱' + val.toLocaleString('en-PH', { maximumFractionDigits: 0 });
  };
  
  const formatFullCurrency = (val: number) => {
    return '₱' + val.toLocaleString('en-PH', { maximumFractionDigits: 0 });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name?: string) => {
    if (!name || name === 'Guest') return 'G';
    return name.substring(0, 2).toUpperCase();
  };
  
  const getShortId = (id: string) => {
    return `#ORD-${id.substring(0, 4).toUpperCase()}`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color={AdminTheme.accent} />
      </View>
    );
  }

  // --- MOBILE PROFILE DETAIL VIEW ---
  if (isMobile && selectedCustomer) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.mobileHeader}>
          <Pressable onPress={() => setSelectedCustomer(null)} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color={AdminTheme.accent} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          <View style={[styles.avatarLarge, { marginBottom: 16 }]}>
            <Text style={styles.avatarLargeText}>{getInitials(selectedCustomer.profile.username)}</Text>
          </View>
          <Text style={styles.profileUsernameLarge}>{selectedCustomer.profile.username || 'Guest'}</Text>
          <Text style={styles.profileEmailMuted}>{selectedCustomer.profile.email || '-'}</Text>

          <View style={styles.mobileStatsRow}>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatLabel}>Orders</Text>
              <Text style={styles.miniStatValue}>{selectedCustomer.orderCount}</Text>
            </View>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatLabel}>LTV</Text>
              <Text style={[styles.miniStatValue, { color: AdminTheme.accent }]}>{formatCurrency(selectedCustomer.ltv)}</Text>
            </View>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatLabel}>Last Order</Text>
              <Text style={styles.miniStatValue}>{selectedCustomer.lastOrderDate ? formatDate(selectedCustomer.lastOrderDate).replace(/, \d{4}/, '') : '-'}</Text>
            </View>
          </View>

          <View style={{ width: '100%', marginTop: 32 }}>
            <Text style={styles.sectionHeading}>ORDER HISTORY</Text>
            {selectedCustomer.orders.length === 0 ? (
              <Text style={styles.emptyText}>No orders yet</Text>
            ) : (
              selectedCustomer.orders.map(order => (
                <View key={order.id} style={styles.mobileOrderRow}>
                  <View>
                    <Text style={styles.orderIdText}>{getShortId(order.id)}</Text>
                    <Text style={styles.orderDateText}>{formatDate(order.created_at)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.orderAmountText}>{formatFullCurrency(order.total_amount)}</Text>
                    <StatusBadge status={order.status} />
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- MOBILE LIST VIEW ---
  if (isMobile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.mobileHeader}>
          <Text style={styles.mobileHeaderTitle}>Customers</Text>
        </View>
        
        {/* Mobile Global Stats */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <View style={[styles.statCard, { minWidth: '45%', padding: 16 }]}>
            <Text style={styles.statLabel}>Customers</Text>
            <Text style={[styles.statValue, { fontSize: 24 }]}>{globalStats.totalCustomers}</Text>
          </View>
          <View style={[styles.statCard, { minWidth: '45%', padding: 16 }]}>
            <Text style={styles.statLabel}>Orders</Text>
            <Text style={[styles.statValue, { fontSize: 24 }]}>{globalStats.totalOrders}</Text>
          </View>
          <View style={[styles.statCard, { minWidth: '100%', padding: 16 }]}>
            <Text style={styles.statLabel}>Total revenue</Text>
            <Text style={[styles.statValue, { fontSize: 24, color: AdminTheme.accent }]}>{formatCurrency(globalStats.totalRevenue)}</Text>
          </View>
        </View>

        <View style={styles.mobileSearchContainer}>
          <Ionicons name="search" size={20} color={AdminTheme.textMuted} />
          <TextInput 
            style={styles.mobileSearchInput}
            placeholder="Search directory..."
            placeholderTextColor={AdminTheme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {filteredCustomers.length === 0 ? (
            <Text style={styles.emptyText}>No customers found</Text>
          ) : (
            filteredCustomers.map(c => (
              <Pressable key={c.profile.id} style={styles.mobileCard} onPress={() => setSelectedCustomer(c)}>
                <View style={styles.mobileCardHeader}>
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>{getInitials(c.profile.username)}</Text>
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.mobileCardName}>{c.profile.username || 'Guest'}</Text>
                    <Text style={styles.mobileCardEmail} numberOfLines={1}>{c.profile.email || '-'}</Text>
                  </View>
                </View>
                <View style={styles.mobileCardFooter}>
                  <Text style={styles.mobileCardOrders}>{c.orderCount} orders</Text>
                  <Text style={styles.mobileCardLtv}>{formatFullCurrency(c.ltv)}</Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- WEB DESKTOP VIEW ---
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.webContent}>
        
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Customers</Text>
          <Text style={styles.pageSubtitle}>View and manage your customer directory</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total customers</Text>
            <Text style={styles.statValue}>{globalStats.totalCustomers}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total orders</Text>
            <Text style={styles.statValue}>{globalStats.totalOrders}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total revenue</Text>
            <Text style={[styles.statValue, { color: AdminTheme.accent }]}>{formatCurrency(globalStats.totalRevenue)}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={AdminTheme.textMuted} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by username or email..."
            placeholderTextColor={AdminTheme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Web Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>CUSTOMER</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>EMAIL</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>ORDERS</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>LIFETIME VALUE</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>JOINED</Text>
            <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'center' }]}></Text>
          </View>

          {filteredCustomers.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={48} color={AdminTheme.textMuted} style={{ opacity: 0.5, marginBottom: 16 }} />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          ) : (
            filteredCustomers.map(customer => {
              const isSelected = selectedCustomer?.profile.id === customer.profile.id;

              return (
                <React.Fragment key={customer.profile.id}>
                  <Pressable 
                    style={({ hovered }) => [
                      styles.tableRow, 
                      hovered && styles.tableRowHover,
                      isSelected && styles.tableRowActive
                    ]}
                    onPress={() => setSelectedCustomer(isSelected ? null : customer)}
                  >
                    <View style={[{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>{getInitials(customer.profile.username)}</Text>
                      </View>
                      <Text style={styles.cellTextDark}>{customer.profile.username || 'Guest'}</Text>
                    </View>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{customer.profile.email || '-'}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{customer.orderCount}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5, color: AdminTheme.accent, fontFamily: 'Inter-SemiBold' }]}>
                      {formatFullCurrency(customer.ltv)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatDate(customer.profile.created_at || null)}</Text>
                    <View style={[{ width: 80, alignItems: 'center' }]}>
                      <View style={styles.viewButton}>
                        <Text style={styles.viewButtonText}>{isSelected ? 'Close' : 'View'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Expandable Detail Panel */}
                  {isSelected && (
                    <View style={styles.detailPanel}>
                      <View style={styles.detailPanelHeader}>
                        <View style={styles.avatarLarge}>
                          <Text style={styles.avatarLargeText}>{getInitials(customer.profile.username)}</Text>
                        </View>
                        <View style={{ marginLeft: 16 }}>
                          <Text style={styles.profileUsernameLarge}>{customer.profile.username || 'Guest'}</Text>
                          <Text style={styles.profileEmailMuted}>{customer.profile.email || '-'} · Joined {formatDate(customer.profile.created_at || null)}</Text>
                        </View>
                      </View>

                      <View style={styles.miniStatsContainer}>
                        <View style={styles.miniStatCard}>
                          <Text style={styles.miniStatLabel}>Total orders</Text>
                          <Text style={styles.miniStatValue}>{customer.orderCount}</Text>
                        </View>
                        <View style={styles.miniStatCard}>
                          <Text style={styles.miniStatLabel}>Lifetime value</Text>
                          <Text style={[styles.miniStatValue, { color: AdminTheme.accent }]}>{formatFullCurrency(customer.ltv)}</Text>
                        </View>
                        <View style={styles.miniStatCard}>
                          <Text style={styles.miniStatLabel}>Last order</Text>
                          <Text style={styles.miniStatValue}>{customer.lastOrderDate ? formatDate(customer.lastOrderDate) : '-'}</Text>
                        </View>
                      </View>

                      <Text style={styles.sectionHeading}>ORDER HISTORY</Text>
                      <View style={styles.historyList}>
                        {customer.orders.length === 0 ? (
                          <Text style={styles.emptyText}>No orders found</Text>
                        ) : (
                          customer.orders.map(order => (
                            <View key={order.id} style={styles.historyRow}>
                              <Text style={[styles.historyCell, { flex: 2, fontFamily: 'Inter-SemiBold' }]}>{getShortId(order.id)}</Text>
                              <Text style={[styles.historyCell, { flex: 2 }]}>{formatDate(order.created_at)}</Text>
                              <Text style={[styles.historyCell, { flex: 2, fontFamily: 'Inter-SemiBold' }]}>{formatFullCurrency(order.total_amount)}</Text>
                              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <StatusBadge status={order.status} />
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  )}
                </React.Fragment>
              );
            })
          )}
        </View>

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
  webContent: {
    padding: 40,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  pageHeader: {
    marginBottom: 32,
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
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: AdminTheme.textMuted,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 28,
    color: AdminTheme.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: AdminTheme.textPrimary,
    outlineStyle: 'none',
  } as any,
  tableContainer: {
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.12)',
  },
  tableHeaderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: AdminTheme.textMuted,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
  },
  tableRowHover: {
    backgroundColor: 'rgba(201,169,110,0.03)',
  },
  tableRowActive: {
    backgroundColor: 'rgba(201,169,110,0.06)',
  },
  tableCell: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: AdminTheme.textMuted,
  },
  cellTextDark: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: AdminTheme.textPrimary,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EBD8',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmallText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#8A7145',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AdminTheme.accent,
  },
  viewButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: AdminTheme.accent,
  },
  detailPanel: {
    backgroundColor: '#F3EFE9',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.12)',
  },
  detailPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3EBD8',
    borderWidth: 1,
    borderColor: AdminTheme.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#8A7145',
  },
  profileUsernameLarge: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 24,
    color: AdminTheme.primaryDark,
    marginBottom: 4,
  },
  profileEmailMuted: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: AdminTheme.textMuted,
  },
  miniStatsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  miniStatCard: {
    backgroundColor: '#FAF7F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.08)',
    flex: 1,
    maxWidth: 200,
  },
  miniStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: AdminTheme.textMuted,
    marginBottom: 4,
  },
  miniStatValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: AdminTheme.textPrimary,
  },
  sectionHeading: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    color: AdminTheme.textMuted,
    marginBottom: 16,
  },
  historyList: {
    backgroundColor: '#FAF7F2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.08)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
  },
  historyCell: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: AdminTheme.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: AdminTheme.textMuted,
    textAlign: 'center',
  },

  // Mobile Styles
  mobileHeader: {
    height: 64,
    backgroundColor: AdminTheme.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeaderTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 22,
    color: AdminTheme.accent,
  },
  mobileSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.1)',
  },
  mobileSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: AdminTheme.textPrimary,
    outlineStyle: 'none',
  } as any,
  mobileCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.1)',
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mobileCardName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: AdminTheme.textPrimary,
  },
  mobileCardEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: AdminTheme.textMuted,
    marginTop: 2,
  },
  mobileCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(43,31,20,0.06)',
  },
  mobileCardOrders: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: AdminTheme.textMuted,
  },
  mobileCardLtv: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: AdminTheme.accent,
  },
  mobileStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  mobileOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.08)',
  },
  orderIdText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: AdminTheme.textPrimary,
  },
  orderDateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: AdminTheme.textMuted,
    marginTop: 4,
  },
  orderAmountText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: AdminTheme.textPrimary,
  },
});
