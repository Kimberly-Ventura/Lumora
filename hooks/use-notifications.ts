import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export type Notification = {
  id: string;
  type: 'new_order' | 'low_stock' | 'new_customer';
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
};

const POLL_INTERVAL_MS = 5000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      // Verify session is active before querying
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.warn('[useNotifications] No active session — skipping fetch');
        if (mountedRef.current) setLoading(false);
        return;
      }

      const { data, error, status, statusText } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!mountedRef.current) return;

      if (error) {
        const msg = `${error.message} (code: ${error.code}, status: ${status})`;
        console.error('[useNotifications] ERROR:', msg);
        setFetchError(msg);
      } else {
        console.log(`[useNotifications] OK — ${data?.length ?? 0} rows`);
        setFetchError(null);
        setNotifications((data ?? []) as Notification[]);
      }
    } catch (e: any) {
      console.error('[useNotifications] EXCEPTION:', e?.message ?? e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
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
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    if (error) console.error('[useNotifications] markAllAsRead error:', error.message);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, fetchError, unreadCount, markAsRead, markAllAsRead };
}
