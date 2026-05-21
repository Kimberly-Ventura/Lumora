import React from 'react';
import { StyleSheet, View, ImageBackground, Dimensions, Pressable, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from './themed-text';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface HeroProps {
  imageUri: any;
}

export function Hero({ imageUri }: HeroProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [scaleAnim] = React.useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleShopNowPress = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      router.push('/(tabs)/shop');
    } else {
      router.push('/signin');
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={imageUri}
        style={styles.image}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ThemedText style={styles.subtitle}>ELEVATE YOUR SPACE</ThemedText>
          <ThemedText style={[styles.title, Typography.heroTitle]}>Refined Comfort</ThemedText>
          
          <View style={styles.buttonContainer}>
            <Animated.View style={{ 
              transform: [{ scale: scaleAnim }],
              opacity: scaleAnim.interpolate({
                inputRange: [0.95, 1],
                outputRange: [0.7, 1]
              })
            }}>
              <Pressable 
                style={[styles.button, styles.glassButton]}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleShopNowPress}
              >
                <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>SHOP NOW</ThemedText>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Platform.OS === 'web' ? 550 : 950,
    borderRadius: Platform.OS === 'web' ? 0 : 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    color: '#F6F1EB',
    fontFamily: 'Inter-SemiBold',
    fontSize: Platform.OS === 'web' ? 12 : 10,
    letterSpacing: 4,
    marginBottom: Spacing.s,
    textAlign: 'center',
  },
  title: {
    color: '#F6F1EB',
    fontSize: Platform.OS === 'web' ? 56 : 32,
    fontFamily: 'Inter-Bold',
    lineHeight: Platform.OS === 'web' ? 64 : 40,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: Spacing.m,
    alignItems: 'center',
    width: '100%',
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)', // For web support if needed
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
