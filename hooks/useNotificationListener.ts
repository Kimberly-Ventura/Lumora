import { useEffect } from 'react';
import { useRealtimeNotifications, Notification } from './useRealtimeNotifications';
import { useNotification } from '@/context/NotificationContext';

export function useNotificationListener(userId: string | null) {
  const { addToast } = useNotification();

  const handleNewNotification = (notification: Notification) => {
    // Map notification types to toast types
    const toastType = notification.type === 'order_update' ? 'info' : 'success';

    addToast({
      type: toastType,
      title: notification.title,
      message: notification.description,
      duration: 5000,
    });
  };

  useRealtimeNotifications(userId, handleNewNotification);
}
