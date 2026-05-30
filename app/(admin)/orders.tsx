import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AdminTheme } from '@/constants/theme';
import { useNotification } from '@/context/NotificationContext';
import { Skeleton } from '@/components/Skeleton';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Profile {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
}

interface Product {
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  products?: Product;
}

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  profiles?: Profile;
  order_items?: OrderItem[];
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FFF3DC', text: '#8A5E00', label: 'Pending' },
  processing: { bg: '#DCE8FF', text: '#1A3F8A', label: 'Processing' },
  shipped: { bg: '#F3EBD8', text: '#7A4F00', label: 'Shipped' },
  delivered: { bg: '#E2F5E2', text: '#1B5E1B', label: 'Delivered' },
  cancelled: { bg: '#FDEAE8', text: '#A1261B', label: 'Cancelled' },
};

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Archived'];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shippingPrompt, setShippingPrompt] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const { addToast } = useNotification();
  
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isMobile = !isWeb || width < 768;

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel(`orders-channel-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      
      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Fetch profiles manually because there is no FK constraint
      const customerIds = [...new Set(ordersData.map(o => o.customer_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', customerIds);
        if (profilesData) {
          profilesMap = Object.fromEntries(profilesData.map(p => [p.id, p]));
        }
      }

      // Fetch order items manually
      const orderIds = ordersData.map(o => o.id);
      let itemsMap: Record<string, any[]> = {};
      if (orderIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
          
        if (itemsData && itemsData.length > 0) {
          const productIds = [...new Set(itemsData.map(i => i.product_id).filter(Boolean))];
          let productsMap: Record<string, any> = {};
          if (productIds.length > 0) {
            const { data: productsData } = await supabase
              .from('products')
              .select('id, name')
              .in('id', productIds);
            if (productsData) {
              productsMap = Object.fromEntries(productsData.map(p => [p.id, p]));
            }
          }

          itemsData.forEach(item => {
            if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
            itemsMap[item.order_id].push({
              ...item,
              products: productsMap[item.product_id] || { name: 'Unknown Product' }
            });
          });
        }
      }

      const combinedData = ordersData.map(order => ({
        ...order,
        profiles: profilesMap[order.customer_id] || null,
        order_items: itemsMap[order.id] || []
      }));

      setOrders(combinedData as any);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, newStatus: string, tracking?: string) => {
    try {
      const updatePayload: any = { status: newStatus.toLowerCase() };
      if (tracking) {
        updatePayload.tracking_number = tracking;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', id);
        
      if (error) throw error;

      // If order was cancelled, stock restoration is now handled automatically
      // at the database level by the 'trg_order_status_updated' trigger.
      // This eliminates RLS errors and ensures consistency across all clients.
      
      // Update local state for immediate feedback
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus.toLowerCase() as OrderStatus } : o));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus.toLowerCase() as OrderStatus });
      }

      // Notify customer
      const targetOrder = orders.find(o => o.id === id);
      if (targetOrder && targetOrder.customer_id) {
        const shortId = `#ORD-${id.substring(0, 4).toUpperCase()}`;
        
        let desc = `Your order ${shortId} has been marked as ${newStatus}.`;
        if (newStatus === 'shipped' && tracking) {
          desc = `Your order ${shortId} has been shipped. Tracking: ${tracking}`;
        }
        
        await supabase.from('customer_notifications').insert({
          user_id: targetOrder.customer_id,
          type: 'order_update',
          title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          description: desc,
          is_read: false
        });
      }
      addToast({ type: 'success', title: 'Status Updated', message: `Order marked as ${newStatus}` });
    } catch (err) {
      console.error('Error updating status:', err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to update order status' });
    }
  };

  const archiveOrder = (id: string) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const restoreOrder = (id: string) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const isArchived = archivedIds.has(o.id);
      
      if (activeFilter === 'Archived') {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false;
        if (activeFilter !== 'All' && o.status.toLowerCase() !== activeFilter.toLowerCase()) {
          return false;
        }
      }

      const searchLower = search.toLowerCase();
      const customerName = o.profiles?.username?.toLowerCase() || 'guest';
      const orderId = o.id.toLowerCase();
      const shortId = `#ord-${o.id.substring(0, 4).toLowerCase()}`;
      const matchesSearch = customerName.includes(searchLower) || orderId.includes(searchLower) || shortId.includes(searchLower);
      return matchesSearch;
    });
  }, [orders, search, activeFilter, archivedIds]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => !archivedIds.has(o.id));
    return {
      total: activeOrders.length,
      pending: activeOrders.filter(o => o.status === 'pending').length,
      processing: activeOrders.filter(o => o.status === 'processing').length,
      shipped: activeOrders.filter(o => o.status === 'shipped').length,
      delivered: activeOrders.filter(o => o.status === 'delivered').length,
      cancelled: activeOrders.filter(o => o.status === 'cancelled').length,
      revenue: activeOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    };
  }, [orders, archivedIds]);

  const formatCurrency = (val: number) => {
    return '₱' + val.toLocaleString('en-PH', { maximumFractionDigits: 0 });
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getShortId = (id: string) => {
    return `#ORD-${id.substring(0, 4).toUpperCase()}`;
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShippingPrompt(false);
    setTrackingNumber('');
    setModalVisible(true);
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
      </View>
    );
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const itemCount = item.order_items?.length || 0;
    const productNames = item.order_items?.map(oi => oi.products?.name || 'Unknown Product').join(', ') || 'No Products';
    return (
      <TouchableOpacity style={styles.mobileCard} onPress={() => openOrderDetails(item)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>{getShortId(item.id)}</Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.cardCustomer}>
          {item.profiles?.username || 'Guest'} · {itemCount} item{itemCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.cardProducts} numberOfLines={1}>
          {productNames}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardTotal}>{formatCurrency(item.total_amount)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {activeFilter === 'Archived' ? (
              <TouchableOpacity onPress={() => restoreOrder(item.id)}>
                <Ionicons name="reload-outline" size={20} color={AdminTheme.secondary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                disabled={item.status !== 'delivered' && item.status !== 'cancelled'}
                onPress={() => archiveOrder(item.id)}
              >
                <Ionicons 
                  name="archive-outline" 
                  size={20} 
                  color={(item.status === 'delivered' || item.status === 'cancelled') ? "#7A6A5A" : "#DCD5CC"} 
                />
              </TouchableOpacity>
            )}
            <StatusBadge status={item.status} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOrderRow = ({ item }: { item: Order }) => {
    const itemCount = item.order_items?.length || 0;
    const productNames = item.order_items?.map(oi => oi.products?.name || 'Unknown Product').join(', ') || 'No Products';

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.cellId]}>{getShortId(item.id)}</Text>
        <Text style={[styles.tableCell, styles.cellCustomer]} numberOfLines={1}>{item.profiles?.username || 'Guest'}</Text>
        <Text style={[styles.tableCell, styles.cellProducts]} numberOfLines={1}>{productNames}</Text>
        <Text style={[styles.tableCell, styles.cellItems]}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        <Text style={[styles.tableCell, styles.cellTotal]}>{formatCurrency(item.total_amount)}</Text>
        <Text style={[styles.tableCell, styles.cellDate]}>{formatDate(item.created_at)}</Text>
        <View style={styles.cellStatus}>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.cellAction}>
          <TouchableOpacity style={styles.updateBtn} onPress={() => openOrderDetails(item)}>
            <Text style={styles.updateBtnText}>Update</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cellArchive}>
          {activeFilter === 'Archived' ? (
            <TouchableOpacity style={[styles.updateBtn, { borderColor: AdminTheme.secondary }]} onPress={() => restoreOrder(item.id)}>
              <Text style={[styles.updateBtnText, { color: AdminTheme.secondary }]}>Restore</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.updateBtn, 
                { borderColor: (item.status === 'delivered' || item.status === 'cancelled') ? '#7A6A5A' : '#EAE4DC' }
              ]} 
              disabled={item.status !== 'delivered' && item.status !== 'cancelled'}
              onPress={() => archiveOrder(item.id)}
            >
              <Text style={[
                styles.updateBtnText, 
                { color: (item.status === 'delivered' || item.status === 'cancelled') ? '#7A6A5A' : '#A09080' }
              ]}>Archive</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={isWeb ? [] : ['top']}>
      
      {/* HEADER */}
      <View style={isMobile ? styles.mobileHeader : styles.webHeader}>
        <Text style={styles.pageTitle}>{isMobile ? 'Orders' : 'Orders management'}</Text>
        <Text style={styles.pageSubtitle}>Track and fulfill customer orders in real time</Text>
      </View>

      {/* STATS CARDS */}
      <View style={isMobile ? [styles.statsContainer, { flexWrap: 'wrap' }] : styles.statsContainer}>
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7].map(key => (
            <View key={`stat-skeleton-${key}`} style={isMobile ? [styles.statCard, { minWidth: '45%' }] : styles.statCard}>
              <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={24} />
            </View>
          ))
        ) : (
          <>
            <View style={isMobile ? [styles.statCard, { minWidth: '45%' }] : styles.statCard}>
              <Text style={styles.statLabel}>Total orders</Text>
              <Text style={styles.statValue}>{stats.total.toLocaleString()}</Text>
            </View>
            <View style={isMobile ? [styles.statCard, { minWidth: '45%' }] : styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: '#B37A17' }]}>{stats.pending}</Text>
            </View>
            <View style={isMobile ? [styles.statCard, { minWidth: '45%' }] : styles.statCard}>
              <Text style={styles.statLabel}>Processing</Text>
              <Text style={[styles.statValue, { color: '#1A3F8A' }]}>{stats.processing}</Text>
            </View>
            <View style={isMobile ? [styles.statCard, { minWidth: '45%' }] : styles.statCard}>
              <Text style={styles.statLabel}>Shipped</Text>
              <Text style={[styles.statValue, { color: AdminTheme.accent }]}>{stats.shipped}</Text>
            </View>
            <View style={isMobile ? [styles.statCard, { minWidth: '45%' }] : styles.statCard}>
              <Text style={styles.statLabel}>Delivered</Text>
              <Text style={[styles.statValue, { color: '#1B5E1B' }]}>{stats.delivered}</Text>
            </View>
            <View style={isMobile ? [styles.statCard, { minWidth: '45%' }] : styles.statCard}>
              <Text style={styles.statLabel}>Cancelled</Text>
              <Text style={[styles.statValue, { color: '#A1261B' }]}>{stats.cancelled}</Text>
            </View>
            <View style={isMobile ? [styles.statCard, { minWidth: '45%' }] : styles.statCard}>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={[styles.statValue, { color: AdminTheme.accent }]}>
                {stats.revenue >= 1000000 
                  ? `₱${(stats.revenue / 1000000).toFixed(1)}M` 
                  : formatCurrency(stats.revenue)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* SEARCH & FILTERS */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={AdminTheme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { outlineStyle: 'none' } as any]}
            placeholder="Search by customer name or order ID..."
            placeholderTextColor={AdminTheme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {FILTERS.map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.chip, activeFilter === filter && styles.chipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.chipText, activeFilter === filter && styles.chipTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LIST OR TABLE */}
      {loading ? (
        <View style={{ flex: 1, padding: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(key => (
            <Skeleton key={`list-skeleton-${key}`} width="100%" height={70} borderRadius={8} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={AdminTheme.secondary} />
          <Text style={styles.emptyText}>No orders found</Text>
        </View>
      ) : isMobile ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.cellId]}>ORDER ID</Text>
            <Text style={[styles.tableHeaderCell, styles.cellCustomer]}>CUSTOMER</Text>
            <Text style={[styles.tableHeaderCell, styles.cellProducts]}>PRODUCTS</Text>
            <Text style={[styles.tableHeaderCell, styles.cellItems]}>ITEMS</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTotal]}>TOTAL</Text>
            <Text style={[styles.tableHeaderCell, styles.cellDate]}>DATE</Text>
            <Text style={[styles.tableHeaderCell, styles.cellStatus]}>STATUS</Text>
            <Text style={[styles.tableHeaderCell, styles.cellActionHeader]}>ACTION</Text>
            <Text style={[styles.tableHeaderCell, styles.cellArchiveHeader]}>ARCHIVE</Text>
          </View>
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id}
            renderItem={renderOrderRow}
          />
        </View>
      )}

      {/* ORDER DETAIL MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Order {getShortId(selectedOrder.id)}</Text>
                    <Text style={styles.modalDate}>{formatDate(selectedOrder.created_at)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={AdminTheme.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Details</Text>
                    <Text style={styles.detailText}>{selectedOrder.profiles?.username || 'Guest'}</Text>
                    {selectedOrder.profiles?.email && <Text style={styles.detailTextMuted}>{selectedOrder.profiles.email}</Text>}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shipping Address</Text>
                    <Text style={styles.detailTextMuted}>123 Rizal St, Olongapo City, Zambales, 2200</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Info</Text>
                    <Text style={styles.detailTextMuted}>Method: GCash</Text>
                    <Text style={styles.detailTextMuted}>Status: Paid</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Line Items</Text>
                    {selectedOrder.order_items?.map((item, idx) => (
                      <View key={item.id || idx} style={styles.lineItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailText}>{item.products?.name || 'Unknown Product'}</Text>
                          <Text style={styles.detailTextMuted}>Qty: {item.quantity} x {formatCurrency(item.unit_price)}</Text>
                        </View>
                        <Text style={styles.lineItemTotal}>{formatCurrency(item.quantity * item.unit_price)}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>{formatCurrency(selectedOrder.total_amount)}</Text>
                  </View>
                  
                  <View style={styles.statusRow}>
                    <Text style={styles.detailText}>Current Status:</Text>
                    <StatusBadge status={selectedOrder.status} />
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, selectedOrder.status === 'processing' && styles.actionBtnDisabled]}
                      disabled={selectedOrder.status === 'processing'}
                      onPress={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    >
                      <Text style={styles.actionBtnText}>Mark as Processing</Text>
                    </TouchableOpacity>
                    
                    {shippingPrompt ? (
                      <View style={styles.trackingContainer}>
                        <TextInput 
                          style={styles.trackingInput} 
                          placeholder="Enter tracking number"
                          placeholderTextColor={AdminTheme.textMuted}
                          value={trackingNumber}
                          onChangeText={setTrackingNumber}
                        />
                        <View style={styles.trackingActions}>
                          <TouchableOpacity 
                            style={[styles.actionBtn, { flex: 1, backgroundColor: AdminTheme.accent }]}
                            onPress={() => {
                              updateOrderStatus(selectedOrder.id, 'shipped', trackingNumber);
                              setShippingPrompt(false);
                            }}
                          >
                            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Confirm</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionBtn, { flex: 1 }]}
                            onPress={() => setShippingPrompt(false)}
                          >
                            <Text style={styles.actionBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.actionBtn, selectedOrder.status === 'shipped' && styles.actionBtnDisabled]}
                        disabled={selectedOrder.status === 'shipped'}
                        onPress={() => setShippingPrompt(true)}
                      >
                        <Text style={styles.actionBtnText}>Mark as Shipped</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, selectedOrder.status === 'delivered' && styles.actionBtnDisabled]}
                      disabled={selectedOrder.status === 'delivered'}
                      onPress={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    >
                      <Text style={styles.actionBtnText}>Mark as Delivered</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, { borderColor: '#FDEAE8', backgroundColor: '#FDEAE8' }]}
                      onPress={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    >
                      <Text style={[styles.actionBtnText, { color: '#A1261B' }]}>Cancel Order</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  webHeader: {
    padding: 32,
    paddingBottom: 16,
  },
  mobileHeader: {
    padding: 20,
    backgroundColor: '#2B1F14',
  },
  pageTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: Platform.OS === 'web' ? 36 : 28,
    color: Platform.OS === 'web' ? '#2B1F14' : '#C9A96E',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: Platform.OS === 'web' ? '#7A6A5A' : '#A69B8F',
  },
  
  // STATS
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Platform.OS === 'web' ? 32 : 20,
    gap: 16,
    marginBottom: 24,
    marginTop: Platform.OS !== 'web' ? 16 : 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
  },
  statLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#7A6A5A',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: '#2B1F14',
  },

  // CONTROLS
  controlsContainer: {
    paddingHorizontal: Platform.OS === 'web' ? 32 : 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#2B1F14',
  },
  chipsContainer: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EAE4DC',
  },
  chipActive: {
    backgroundColor: '#C9A96E',
  },
  chipText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#7A6A5A',
  },
  chipTextActive: {
    color: '#2B1F14',
    fontWeight: '500',
  },

  // LIST / TABLE
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  mobileCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardId: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#2B1F14',
  },
  cardDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#7A6A5A',
  },
  cardCustomer: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#2B1F14',
    marginBottom: 4,
  },
  cardProducts: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#7A6A5A',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTotal: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#2B1F14',
  },

  // WEB TABLE
  tableContainer: {
    flex: 1,
    marginHorizontal: 32,
    marginBottom: 32,
    backgroundColor: '#FAF7F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#7A6A5A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    // Note: react-native web handles hover via pseudo classes, using simple background color here
  },
  tableCell: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#2B1F14',
  },
  cellId: { flex: 1, fontFamily: 'Inter-SemiBold' },
  cellCustomer: { flex: 1.2 },
  cellProducts: { flex: 3.5 },
  cellItems: { flex: 0.8 },
  cellTotal: { flex: 1, fontFamily: 'Inter-SemiBold' },
  cellDate: { flex: 1.2 },
  cellStatus: { flex: 1.2 },
  cellActionHeader: { flex: 1, textAlign: 'center' },
  cellAction: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  cellArchiveHeader: { flex: 1, textAlign: 'center' },
  cellArchive: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  
  updateBtn: {
    borderWidth: 1,
    borderColor: '#C9A96E',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  updateBtnText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#C9A96E',
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },

  // UTILS
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  emptyText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: '#7A6A5A',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43,31,20,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.12)',
  },
  modalTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 24,
    color: '#2B1F14',
  },
  modalDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#7A6A5A',
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    textTransform: 'uppercase',
    color: '#7A6A5A',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  detailText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: '#2B1F14',
    marginBottom: 4,
  },
  detailTextMuted: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#7A6A5A',
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
  },
  lineItemTotal: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#2B1F14',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(43,31,20,0.12)',
    marginBottom: 24,
  },
  totalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#2B1F14',
  },
  totalAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#C9A96E',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#F5F0E8',
    borderWidth: 1,
    borderColor: '#C9A96E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    borderColor: 'rgba(43,31,20,0.12)',
    backgroundColor: '#EAE4DC',
  },
  actionBtnText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#C9A96E',
  },
  trackingContainer: {
    gap: 8,
    marginBottom: 8,
  },
  trackingInput: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#2B1F14',
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
  },
  trackingActions: {
    flexDirection: 'row',
    gap: 12,
  }
});
