import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Notification = {
  id: string;
  type: 'new_order' | 'low_stock' | 'new_customer' | 'order_cancelled' | 'out_of_stock';
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch settings and notifications in parallel
      // NOTE: No session guard here — the admin uses a mock session (AsyncStorage)
      // and the notifications table now has a public SELECT RLS policy.
      const [settingsRes, notifRes, clearedAtStr] = await Promise.all([
        supabase.from('store_settings').select('*').limit(1).single(),
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        AsyncStorage.getItem('cleared_admin_notifs_at'),
      ]);

      if (!mountedRef.current) return;

      if (notifRes.error) {
        const msg = `${notifRes.error.message} (code: ${notifRes.error.code})`;
        console.error('[useNotifications] fetch error:', msg);
        setFetchError(msg);
        return;
      }

      const settings = settingsRes.data || {};
      const rawNotifs = (notifRes.data ?? []) as Notification[];
      const clearedAt = clearedAtStr ? parseInt(clearedAtStr, 10) : 0;

      // Filter based on settings toggles and cleared timestamp
      const filtered = rawNotifs.filter((n) => {
        if (n.type === 'new_order' && settings.notify_new_order === false) return false;
        if (n.type === 'low_stock' && settings.notify_low_stock === false) return false;
        if (n.type === 'new_customer' && settings.notify_new_customer === false) return false;
        if (new Date(n.created_at).getTime() <= clearedAt) return false;
        return true;
      });

      setFetchError(null);
      setNotifications(filtered);
    } catch (e: any) {
      console.error('[useNotifications] exception:', e?.message ?? e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();

    // Realtime subscription for instant updates
    const channel = supabase
      .channel(`admin_notif_rt_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('[useNotifications] Realtime status:', status);
      });

    // Fallback poll every 5s in case Realtime drops
    const interval = setInterval(fetchNotifications, 5000);

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) console.error('[useNotifications] markAsRead error:', error.message);
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    if (error) console.error('[useNotifications] markAllAsRead error:', error.message);
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    await AsyncStorage.setItem('cleared_admin_notifs_at', Date.now().toString());
    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all (may fail silently if RLS blocked, but AsyncStorage hides them)
    if (error) console.error('[useNotifications] clearAll error:', error.message);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, fetchError, unreadCount, markAsRead, markAllAsRead, clearAll };
}
