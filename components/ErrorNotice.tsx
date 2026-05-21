import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ThemedText } from './themed-text';
import { Ionicons } from '@expo/vector-icons';

interface ErrorNoticeProps {
  message: string | null;
}

export const ErrorNotice: React.FC<ErrorNoticeProps> = ({ message }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [opacity] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (message) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' }]}>
      <Ionicons name="alert-circle" size={20} color="#C53030" />
      <ThemedText style={styles.text}>{message}</ThemedText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.s,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.m,
    gap: Spacing.xs,
  },
  text: {
    ...Typography.smallText,
    color: '#C53030',
    flex: 1,
  },
});
