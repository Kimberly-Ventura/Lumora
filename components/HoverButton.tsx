import React, { useState } from 'react';
import { Pressable, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ThemedText } from './themed-text';

interface HoverButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const HoverButton: React.FC<HoverButtonProps> = ({ title, onPress, loading, variant = 'primary' }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        style={[
          styles.button,
          {
            backgroundColor: isPrimary ? colors.tint : 'transparent',
            borderColor: colors.tint,
            borderWidth: isPrimary ? 0 : 1,
          }
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? colors.background : colors.tint} />
        ) : (
          <ThemedText style={[
            styles.text,
            { color: isPrimary ? colors.background : colors.tint }
          ]}>
            {title}
          </ThemedText>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    ...Typography.cardTitle,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
});
