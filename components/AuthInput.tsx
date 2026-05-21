import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Animated } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ThemedText } from './themed-text';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, error, ...props }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isFocused, setIsFocused] = useState(false);
  const [focusAnim] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.tint],
  });

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Animated.View style={[
        styles.inputContainer,
        { borderColor, backgroundColor: colors.cardBackground }
      ]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.icon}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
    width: '100%',
  },
  label: {
    ...Typography.smallText,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  inputContainer: {
    height: 56,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: Spacing.m,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
});
