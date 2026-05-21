import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

// ── Custom Interactive Glass Button ──
interface GlassButtonProps {
  title: string;
  onPress: () => void;
  dark?: boolean;
}

const GlassButton: React.FC<GlassButtonProps> = ({ title, onPress, dark = false }) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [hovered, setHovered] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={styles.pressable}
      >
        <BlurView 
          intensity={Platform.OS === 'ios' ? 20 : 35} 
          tint={dark ? "dark" : "light"} 
          style={[
            styles.blurBtn,
            {
              backgroundColor: dark 
                ? (hovered ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.18)')
                : (hovered ? 'rgba(17, 17, 17, 0.12)' : 'rgba(17, 17, 17, 0.05)'),
              borderColor: dark 
                ? (hovered ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.35)')
                : (hovered ? 'rgba(17, 17, 17, 0.4)' : 'rgba(17, 17, 17, 0.25)'),
            }
          ]}
        >
          <ThemedText style={[styles.btnText, { color: dark ? '#FFFFFF' : '#111111' }]}>
            {title}
          </ThemedText>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { username } = useLocalSearchParams<{ username: string }>();

  const isWeb = Platform.OS === 'web';
  
  // Platform-Specific background and assets
  const webBg = require('@/assets/images/welcome-bg.png');
  const mobileChair = require('@/assets/images/welcome-chair.png');

  if (isWeb) {
    // ── Web Layout: High-res room background + centered content overlay ──
    return (
      <View style={styles.container}>
        <Image 
          source={webBg} 
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={400}
        />
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <ThemedText style={styles.brandText}>LUMORA</ThemedText>
            
            <ThemedText style={styles.title}>
              Welcome, {username || 'User'}
            </ThemedText>
            
            <ThemedText style={styles.subtitle}>
              Design your perfect space.
            </ThemedText>
            
            <View style={styles.buttonWrapper}>
              <GlassButton 
                title="Get Started" 
                onPress={() => router.replace('/(tabs)')} 
                dark={true}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Mobile Layout: Solid Ivory theme background + floating chair centerpiece ──
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mobileWrapper}>
        
        {/* Top Header Section with elegant, lowered font sizes */}
        <View style={styles.mobileHeader}>
          <ThemedText style={[styles.mobileBrandText, { color: colors.text }]}>
            LUMORA
          </ThemedText>
          <ThemedText style={[styles.mobileTitle, { color: colors.text }]}>
            Welcome, {username || 'User'}
          </ThemedText>
          <ThemedText style={styles.mobileSubtitle}>
            Design your perfect space.
          </ThemedText>
        </View>

        {/* Center: Large, ultra-realistic enhanced high-resolution chair centerpiece */}
        <View style={styles.mobileHero}>
          <Image 
            source={mobileChair} 
            style={styles.mobileChairImage}
            contentFit="contain"
            transition={500}
          />
        </View>

        {/* Bottom Action Section: Elevated position for optimal ergonomic reach */}
        <View style={styles.mobileFooter}>
          <View style={styles.mobileButtonWrapper}>
            <GlassButton 
              title="Get Started" 
              onPress={() => router.replace('/(auth)/artutorial')} 
              dark={false}
            />
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Web Styles ──
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingHorizontal: Spacing.l,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 8,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: Spacing.s,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 44,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: Spacing.xl * 1.5,
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 280,
    paddingHorizontal: Spacing.s,
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.15))',
      }
    })
  },

  // ── Mobile Styles ──
  mobileWrapper: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 50 : 35, // Pushes the stack up slightly
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    marginTop: 15,
  },
  mobileBrandText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 6,
    opacity: 0.45,
    marginBottom: Spacing.s,
    textTransform: 'uppercase',
  },
  mobileTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 25, // Lowered font size from 34 for high-end elegance
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  mobileSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15, // Refined and lowered from 16
    color: '#655E56',
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.8,
  },
  mobileHero: {
    width: '100%',
    height: '48%', // Increased container height to enlarge the chair
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileChairImage: {
    width: '100%', // Full width inside hero container
    height: '100%', // Full height inside hero container
  },
  mobileFooter: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25, // Puts the button higher from the screen border
  },
  mobileButtonWrapper: {
    width: '100%',
    maxWidth: 280,
    ...Platform.select({
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }
    })
  },

  // ── Shared Button Styles ──
  pressable: {
    width: '100%',
  },
  blurBtn: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      web: {
        transition: 'all 0.25s ease-in-out',
      }
    })
  },
  btnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
