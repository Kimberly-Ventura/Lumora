import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '@/context/NotificationContext';

const TOAST_HEIGHT = 80;
const TOAST_WIDTH = 320;

export function ToastNotificationContainer() {
  const { toasts, removeToast } = useNotification();

  return (
    <View style={styles.container}>
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
}

interface ToastItemProps {
  toast: any;
  index: number;
  onDismiss: () => void;
}

function ToastItem({ toast, index, onDismiss }: ToastItemProps) {
  const slideAnim = React.useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [slideAnim]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#D4EDDA';
      case 'error':
        return '#F8D7DA';
      case 'warning':
        return '#FFF3CD';
      case 'info':
      default:
        return '#D1ECF1';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return '#155724';
      case 'error':
        return '#721C24';
      case 'warning':
        return '#856404';
      case 'info':
      default:
        return '#0C5460';
    }
  };

  const getIconName = () => {
    switch (toast.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const textColor = getTextColor();

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateX: slideAnim }],
          marginBottom: 12,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: getBackgroundColor(),
            borderLeftColor: textColor,
          },
        ]}
      >
        <Ionicons name={getIconName()} size={24} color={textColor} style={styles.icon} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]}>{toast.title}</Text>
          <Text style={[styles.message, { color: textColor }]}>{toast.message}</Text>
        </View>
        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={textColor} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 9999,
    maxWidth: TOAST_WIDTH,
  },
  toastWrapper: {
    width: TOAST_WIDTH,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
