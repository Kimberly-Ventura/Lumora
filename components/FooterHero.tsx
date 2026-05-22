import React from 'react';
import { StyleSheet, View, ImageBackground, Dimensions, Pressable, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && width > 768;

export function FooterHero() {
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
      router.push('/(tabs)/shop' as any);
    } else {
      router.push('/signin');
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/footer_hero.png')}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay}>
          {/* Main Content */}
          <View style={styles.mainContent}>
            <ThemedText style={[Typography.heroTitle, styles.title, { color: '#FFFFFF' }]}>
              DESIGN THAT SPEAKS{'\n'}SIMPLICITY
            </ThemedText>
            <ThemedText style={[styles.subtitle, Typography.bodyText, { color: '#FFFFFF' }]}>
              Minimal, functional, and beautifully crafted the perfect finish to{'\n'}your modern home.
            </ThemedText>
            

          </View>

          {/* Footer Links */}
          <View style={[styles.footerBottom, isWeb && styles.footerBottomWeb]}>
            <View style={styles.footerLinks}>
              <ThemedText style={styles.footerLink}>Contact Us</ThemedText>
              <ThemedText style={styles.footerLink}>Privacy Policy</ThemedText>
              <ThemedText style={styles.footerLink}>Terms</ThemedText>
            </View>
            
            <ThemedText style={styles.footerLogo}>LUMORA</ThemedText>
            
            <ThemedText style={styles.copyright}>
              © 2026 VISIONCRAFT. All rights reserved.
            </ThemedText>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: '100%',
  },
  imageBackground: {
    width: '100%',
    height: isWeb ? 600 : 550, // Increased height slightly for mobile
  },
  imageStyle: {
    borderRadius: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    justifyContent: 'space-between',
    padding: isWeb ? 40 : 24, // Reduced padding for mobile
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: isWeb ? 0 : 20,
    paddingBottom: isWeb ? 0 : 20,
  },
  title: {
    textAlign: 'center',
    lineHeight: isWeb ? 64 : 28,
    marginBottom: 10,
    fontSize: isWeb ? 56 : 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: isWeb ? 40 : 25,
    opacity: 0.9,
    fontSize: isWeb ? 16 : 12,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  footerBottom: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
    paddingBottom: 10,
  },
  footerBottomWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 0,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  footerLink: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    opacity: 0.8,
  },
  footerLogo: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    letterSpacing: 2,
  },
  copyright: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    opacity: 0.7,
  },
});
