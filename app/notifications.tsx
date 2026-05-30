import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  useCustomerNotifications,
  type CustomerNotification,
} from '@/hooks/use-customer-notifications';
import { Skeleton } from '@/components/Skeleton';

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  // Supabase returns timestamps without timezone suffix — append Z so JS
  // treats them as UTC instead of local time (avoids the +8h offset bug).
  const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const diff = Math.floor((Date.now() - new Date(utcIso).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({
  item,
  onPress,
}: {
  item: CustomerNotification;
  onPress: (item: CustomerNotification) => void;
}) {
  const isOrder = item.type === 'order_update';

  let iconName = 'notifications-outline' as any;
  let iconColor = '#8A9E85';
  let bgColor = '#8A9E851A';

  if (isOrder) {
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('placed')) {
      iconName = 'cube-outline';
      iconColor = '#C9A96E';
      bgColor = '#C9A96E1A';
    } else if (titleLower.includes('processing')) {
      iconName = 'time-outline';
      iconColor = '#1A3F8A';
      bgColor = '#1A3F8A1A';
    } else if (titleLower.includes('shipped')) {
      iconName = 'airplane-outline';
      iconColor = '#7A4F00';
      bgColor = '#7A4F001A';
    } else if (titleLower.includes('delivered')) {
      iconName = 'checkmark-circle-outline';
      iconColor = '#1B5E1B';
      bgColor = '#1B5E1B1A';
    } else if (titleLower.includes('cancelled')) {
      iconName = 'close-circle-outline';
      iconColor = '#A1261B';
      bgColor = '#A1261B1A';
    } else {
      iconName = 'cart-outline';
      iconColor = '#C9A96E';
      bgColor = '#C9A96E1A';
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !item.is_read && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
    >
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Ionicons
          name={iconName}
          size={20}
          color={iconColor}
        />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, item.is_read && styles.titleRead]}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.time}>{relativeTime(item.created_at)}</Text>
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();

  // Three-state session resolution: null = loading, string = resolved, '' = no session
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pass null while session is still loading (undefined) so hook waits
  const resolvedUserId = userId === undefined ? null : userId;
  const sessionLoading = userId === undefined;

  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } =
    useCustomerNotifications(resolvedUserId);

  const handlePress = useCallback(
    (item: CustomerNotification) => {
      // Fire-and-forget to make UI instantly responsive
      markAsRead(item.id);

      if (item.type === 'order_update') {
        const match = item.description.match(/#ORD-([A-Z0-9]{4})/i);
        if (match) {
          const shortId = match[1].toLowerCase();
          (async () => {
            try {
              const { data } = await supabase
                .from('orders')
                .select('id')
                .ilike('id', `${shortId}%`)
                .single();
              if (data && data.id) {
                router.push(`/order/${data.id}` as any);
              } else {
                router.push('/order-history' as any);
              }
            } catch {
              router.push('/order-history' as any);
            }
          })();
          return;
        }
        router.push('/order-history' as any);
      } else if (item.type === 'promotion') {
        // Handle new product / sale notifications
        router.push('/product-list' as any);
      }
    },
    [markAsRead, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: CustomerNotification }) => (
      <NotificationRow item={item} onPress={handlePress} />
    ),
    [handlePress]
  );

  const isLoading = sessionLoading || loading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2B1F14" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={markAllAsRead}
          style={styles.markAllBtn}
          disabled={unreadCount === 0}
        >
          <Text style={[styles.markAllText, unreadCount === 0 && { opacity: 0.4 }]}>
            Mark all as read
          </Text>
        </Pressable>
      </View>

      {/* Not logged in */}
      {!sessionLoading && !userId ? (
        <View style={styles.center}>
          <Ionicons name="person-outline" size={48} color="#C8BAA8" />
          <Text style={styles.emptyTitle}>Sign in to see notifications</Text>
          <Pressable
            style={styles.signInBtn}
            onPress={() => router.push('/signin' as any)}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5].map(key => (
            <View key={`skeleton-${key}`} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: 'transparent' }]}>
                <Skeleton width={40} height={40} borderRadius={20} />
              </View>
              <View style={styles.textWrap}>
                <Skeleton width="60%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="90%" height={12} style={{ marginBottom: 4 }} />
                <Skeleton width={40} height={10} />
              </View>
            </View>
          ))}
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={56} color="#C8BAA8" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            We&apos;ll let you know when something happens with your orders.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.08)',
    backgroundColor: '#F5F0E8',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 26,
    color: '#2B1F14',
  },
  markAllBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  markAllText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#C9A96E',
  },
  list: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
    backgroundColor: '#F5F0E8',
  },
  rowUnread: {
    backgroundColor: 'rgba(201,169,110,0.07)',
    borderLeftWidth: 3,
    borderLeftColor: '#C9A96E',
  },
  rowPressed: {
    opacity: 0.72,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#2B1F14',
  },
  titleRead: {
    color: '#7A6A5A',
  },
  description: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#7A6A5A',
    lineHeight: 18,
  },
  time: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: '#A09080',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A96E',
    marginTop: 6,
    flexShrink: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 22,
    color: '#2B1F14',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#7A6A5A',
    textAlign: 'center',
    lineHeight: 20,
  },
  signInBtn: {
    marginTop: 8,
    backgroundColor: '#C9A96E',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  signInBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#2B1F14',
  },
});
