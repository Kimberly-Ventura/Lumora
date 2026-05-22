import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'order_update' | 'new_product' | 'promotion' | 'system';
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
}

export function useRealtimeNotifications(
  userId: string | null,
  onNewNotification?: (notification: Notification) => void
) {
  const subscriptionRef = useRef<any>(null);
  const callbackRef = useRef(onNewNotification);

  // Keep callback ref up-to-date without triggering re-subscription
  useEffect(() => {
    callbackRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    // Always tear down any existing channel first to avoid duplicate subscriptions
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    if (!userId) return;

    // Use a unique channel name each time so Supabase never tries to reuse
    // an already-subscribed channel topic, which causes the error:
    // "cannot add postgres_changes callbacks after subscribe()"
    const channelName = `notifications:${userId}:${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          callbackRef.current?.(newNotification);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      subscriptionRef.current = null;
    };
  }, [userId]);

  return subscriptionRef.current;
}
