import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export type CustomerNotification = {
  id: string;
  user_id: string;
  type: 'order_update' | 'promotion';
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
};

const POLL_INTERVAL_MS = 5000;

export function useCustomerNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  // Start as true — stay true until we have a userId and complete the first fetch
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!mountedRef.current) return;

      if (error) {
        console.error('[CustomerNotifications] fetch error:', error.message, error.code);
      } else {
        setNotifications((data ?? []) as CustomerNotification[]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!userId) {
      // No user — clear state but keep loading:true so the screen
      // doesn't flash "empty" while the session is still resolving
      setNotifications([]);
      // Only set loading false if userId is explicitly null (no session),
      // not undefined (still loading). The screen handles this distinction.
      setLoading(false);
      return;
    }

    // Have a userId — fetch immediately then setup real-time subscription
    setLoading(true);
    fetchNotifications(userId);

    const channel = supabase
      .channel(`customer_notifications_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (_payload) => {
          fetchNotifications(userId);
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const { error } = await supabase
      .from('customer_notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) console.error('[CustomerNotifications] markAsRead error:', error.message);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from('customer_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) console.error('[CustomerNotifications] markAllAsRead error:', error.message);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}
