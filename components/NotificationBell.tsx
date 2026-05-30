import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications, type Notification } from '@/hooks/use-notifications';

// ─── Relative time helper ────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  // Supabase timestamps have no timezone suffix — append Z to treat as UTC
  const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const diff = Math.floor((Date.now() - new Date(utcIso).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Per-type config ─────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  new_order: {
    icon: 'cart-outline' as const,
    color: '#C9A96E',
    route: '/(admin)/orders',
  },
  low_stock: {
    icon: 'warning-outline' as const,
    color: '#E07B39',
    route: '/(admin)/products',
  },
  new_customer: {
    icon: 'person-add-outline' as const,
    color: '#4CAF50',
    route: '/(admin)/customers',
  },
  order_cancelled: {
    icon: 'close-circle-outline' as const,
    color: '#A1261B',
    route: '/(admin)/orders',
  },
  out_of_stock: {
    icon: 'alert-circle-outline' as const,
    color: '#C0392B',
    route: '/(admin)/products',
  },
};

// ─── Single notification row ─────────────────────────────────────────────────

function NotificationRow({
  item,
  onPress,
}: {
  item: Notification;
  onPress: (item: Notification) => void;
}) {
  const cfg = TYPE_CONFIG[item.type];

  return (
    <Pressable
      style={({ pressed }) => [
        rowStyles.row,
        !item.is_read && rowStyles.rowUnread,
        pressed && rowStyles.rowPressed,
      ]}
      onPress={() => onPress(item)}
    >
      {/* Icon */}
      <View style={[rowStyles.iconWrap, { backgroundColor: cfg.color + '1A' }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>

      {/* Text */}
      <View style={rowStyles.textWrap}>
        <Text style={[rowStyles.title, item.is_read && rowStyles.titleRead]}>
          {item.title}
        </Text>
        <Text style={rowStyles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={rowStyles.time}>{relativeTime(item.created_at)}</Text>
      </View>

      {/* Unread dot */}
      {!item.is_read && <View style={rowStyles.unreadDot} />}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.06)',
  },
  rowUnread: {
    backgroundColor: 'rgba(201,169,110,0.07)',
    borderLeftWidth: 3,
    borderLeftColor: '#C9A96E',
  },
  rowPressed: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: '#2B1F14',
  },
  titleRead: {
    color: '#7A6A5A',
  },
  description: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#7A6A5A',
    lineHeight: 17,
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
    marginTop: 4,
    flexShrink: 0,
  },
});

// ─── Dropdown panel ──────────────────────────────────────────────────────────

type PanelProps = {
  notifications: Notification[];
  loading: boolean;
  fetchError: string | null;
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
};

function NotificationPanel({
  notifications,
  loading,
  fetchError,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}: PanelProps) {
  const router = useRouter();

  const handleItem = useCallback(
    (item: Notification) => {
      onMarkAsRead(item.id);
      onClose();
      if (TYPE_CONFIG[item.type]?.route) {
        router.push(TYPE_CONFIG[item.type].route as any);
      }
    },
    [onMarkAsRead, onClose, router]
  );

  return (
    <View style={panelStyles.panel}>
      {/* Header */}
      <View style={panelStyles.header}>
        <Text style={panelStyles.headerTitle}>Notifications</Text>
        <Pressable onPress={onMarkAllAsRead}>
          <Text style={panelStyles.markAll}>Mark all as read</Text>
        </Pressable>
      </View>

      {/* Body */}
      {loading ? (
        <View style={panelStyles.center}>
          <ActivityIndicator color="#C9A96E" />
        </View>
      ) : fetchError ? (
        <View style={panelStyles.center}>
          <Ionicons name="alert-circle-outline" size={36} color="#C0392B" />
          <Text style={[panelStyles.emptyText, { color: '#C0392B', textAlign: 'center', paddingHorizontal: 12 }]}>
            {fetchError}
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={panelStyles.center}>
          <Ionicons name="notifications-off-outline" size={36} color="#C8BAA8" />
          <Text style={panelStyles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <ScrollView
          style={panelStyles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {notifications.map((item) => (
            <NotificationRow key={item.id} item={item} onPress={handleItem} />
          ))}
        </ScrollView>
      )}

      {/* Footer */}
      <Pressable 
        style={panelStyles.footer}
        onPress={() => {
          onClose();
          router.push('/(admin)/notifications' as any);
        }}
      >
        <Text style={panelStyles.footerText}>See all notifications</Text>
      </Pressable>
    </View>
  );
}

const panelStyles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 56,
    right: 0,
    width: Platform.OS === 'web' ? 320 : 300,
    maxHeight: 420,
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,31,20,0.08)',
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 18,
    color: '#2B1F14',
  },
  markAll: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#C9A96E',
  },
  list: {
    maxHeight: 360,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#A09080',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(43,31,20,0.08)',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
  },
  footerText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: '#C9A96E',
  },
});

// ─── Bell button (exported) ──────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const bellRef = useRef<any>(null);

  // Single hook call — data flows down to the panel as props
  const { notifications, loading, fetchError, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  // Close on outside click (web only)
  useEffect(() => {
    if (Platform.OS !== 'web' || !open) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Use standard DOM contains check for web
      if (bellRef.current && !bellRef.current.contains(target)) {
        setOpen(false);
      }
    };

    // Small delay so the opening click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  return (
    <View ref={bellRef} style={bellStyles.wrapper}>
      <Pressable
        style={({ hovered }: any) => [
          bellStyles.btn,
          hovered && bellStyles.btnHovered,
        ]}
        onPress={() => setOpen((v) => !v)}
        accessibilityLabel="Notifications"
      >
        <Ionicons
          name={open ? 'notifications' : 'notifications-outline'}
          size={20}
          color="#8A9E85"
        />
        {unreadCount > 0 && (
          <View style={bellStyles.badge}>
            <Text style={bellStyles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      {open && (
        <NotificationPanel
          notifications={notifications}
          loading={loading}
          fetchError={fetchError}
          onClose={() => setOpen(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      )}
    </View>
  );
}

const bellStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginLeft: 8,
    zIndex: 1000,
    elevation: 1000,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnHovered: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C9A96E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    color: '#2B1F14',
    lineHeight: 14,
  },
});
