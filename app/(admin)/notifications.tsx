import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AdminTheme } from '@/constants/theme';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { Skeleton } from '@/components/Skeleton';

const TYPE_CONFIG = {
  new_order: { icon: 'cart-outline' as const, color: '#C9A96E', route: '/(admin)/orders' },
  low_stock: { icon: 'warning-outline' as const, color: '#E07B39', route: '/(admin)/products' },
  new_customer: { icon: 'person-add-outline' as const, color: '#4CAF50', route: '/(admin)/customers' },
  order_cancelled: { icon: 'close-circle-outline' as const, color: '#A1261B', route: '/(admin)/orders' },
  out_of_stock: { icon: 'alert-circle-outline' as const, color: '#C0392B', route: '/(admin)/products' },
};

function relativeTime(iso: string): string {
  // Supabase timestamps have no timezone suffix — append Z to treat as UTC
  const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const diff = Math.floor((Date.now() - new Date(utcIso).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = !isWeb || width < 768;

  const { notifications, loading, fetchError, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const handleItem = useCallback(
    (item: Notification) => {
      markAsRead(item.id);
      if (TYPE_CONFIG[item.type]?.route) {
        router.push(TYPE_CONFIG[item.type].route as any);
      }
    },
    [markAsRead, router]
  );

  const renderItem = ({ item }: { item: Notification }) => {
    const cfg = TYPE_CONFIG[item.type];
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          !item.is_read && styles.rowUnread,
          pressed && styles.rowPressed,
        ]}
        onPress={() => handleItem(item)}
      >
        <View style={[styles.iconWrap, { backgroundColor: (cfg?.color || '#999') + '1A' }]}>
          <Ionicons name={cfg?.icon || 'notifications'} size={24} color={cfg?.color || '#999'} />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, item.is_read && styles.titleRead]}>{item.title}</Text>
            <Text style={styles.time}>{relativeTime(item.created_at)}</Text>
          </View>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {!item.is_read && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={isWeb ? [] : ['top']}>
      {/* HEADER */}
      <View style={isMobile ? styles.mobileHeader : styles.webHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.pageSubtitle}>Stay updated on orders, stock, and customers</Text>
        
        <View style={styles.headerActions}>
          <Pressable 
            style={[styles.markAllBtn, unreadCount === 0 && { opacity: 0.5 }]} 
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#C9A96E" style={{ marginRight: 6 }} />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>

          <Pressable 
            style={[styles.clearAllBtn, notifications.length === 0 && { opacity: 0.5 }]} 
            onPress={clearAll}
            disabled={notifications.length === 0}
          >
            <Ionicons name="trash-outline" size={18} color="#C0392B" style={{ marginRight: 6 }} />
            <Text style={styles.clearAllText}>Clear all</Text>
          </Pressable>
        </View>
      </View>

      {/* LIST */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.listContent}>
            {[1, 2, 3, 4, 5].map(key => (
              <View key={`notif-skeleton-${key}`} style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: 'transparent' }]}>
                  <Skeleton width={48} height={48} borderRadius={24} />
                </View>
                <View style={styles.textWrap}>
                  <View style={styles.titleRow}>
                    <Skeleton width="50%" height={16} />
                    <Skeleton width={40} height={12} />
                  </View>
                  <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />
                  <Skeleton width="70%" height={14} style={{ marginTop: 4 }} />
                </View>
              </View>
            ))}
          </View>
        ) : fetchError ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color="#C0392B" />
            <Text style={[styles.emptyText, { color: '#C0392B', marginTop: 16 }]}>{fetchError}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="notifications-off-outline" size={64} color={AdminTheme.secondary} />
            <Text style={[styles.emptyText, { marginTop: 16 }]}>No notifications found</Text>
            <Text style={styles.emptySubText}>When you receive notifications, they will appear here.</Text>
          </View>
        ) : (
          <View style={styles.listWrapper}>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>
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
    paddingBottom: 24,
  },
  mobileHeader: {
    padding: 20,
    backgroundColor: '#2B1F14',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pageTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: Platform.OS === 'web' ? 36 : 28,
    color: Platform.OS === 'web' ? '#2B1F14' : '#C9A96E',
  },
  badge: {
    backgroundColor: '#C9A96E',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 12,
  },
  badgeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: '#2B1F14',
  },
  pageSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: Platform.OS === 'web' ? '#7A6A5A' : '#A69B8F',
  },
  headerActions: {
    marginTop: 16,
    flexDirection: 'row',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(201,169,110,0.1)',
  },
  markAllText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: '#C9A96E',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
    marginLeft: 12,
  },
  clearAllText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: '#C0392B',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? 32 : 0,
  },
  listWrapper: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: Platform.OS === 'web' ? 12 : 0,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(43,31,20,0.12)',
    overflow: 'hidden',
    marginBottom: Platform.OS === 'web' ? 32 : 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
  },
  rowUnread: {
    backgroundColor: 'rgba(201,169,110,0.05)',
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#2B1F14',
  },
  titleRead: {
    color: '#7A6A5A',
  },
  description: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#7A6A5A',
    lineHeight: 20,
  },
  time: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#A09080',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C9A96E',
    marginTop: 6,
    marginLeft: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 24,
    color: '#2B1F14',
  },
  emptySubText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#7A6A5A',
    marginTop: 8,
  },
});
