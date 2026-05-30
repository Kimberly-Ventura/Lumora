import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, borderRadius = 4, style }: SkeletonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const color1 = isDark ? '#333333' : '#E0E0E0';
    const color2 = isDark ? '#444444' : '#F5F5F5';
    
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [color1, color2]
      ),
    };
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius } as ViewStyle,
        animatedStyle,
        style,
      ]}
    />
  );
}
