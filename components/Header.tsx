import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Pressable, Platform, useWindowDimensions, Modal, ScrollView, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { TextInput } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomerNotifications } from '@/hooks/use-customer-notifications';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Customer notifications — mobile only, logged-in users only
  const userId = session?.user?.id ?? null;
  const { unreadCount } = useCustomerNotifications(
    Platform.OS !== 'web' ? userId : null
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes dynamically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load avatar from AsyncStorage whenever session changes
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const userId = session?.user?.id;
        if (userId) {
          const uri = await AsyncStorage.getItem(`avatar_${userId}`);
          setAvatarUri(uri);
        } else {
          setAvatarUri(null);
        }
      } catch (e) {
        setAvatarUri(null);
      }
    };
    loadAvatar();
    // Poll every 2 seconds to pick up profile picture changes
    const interval = setInterval(loadAvatar, 2000);
    return () => clearInterval(interval);
  }, [session]);

  // If the active screen is part of the (tabs) folder, it is a primary root tab screen (except /shop, which gets a back button)
  const isRootScreen = segments[0] === '(tabs)' && pathname !== '/shop';
  const showBackButton = !isRootScreen && (pathname === '/shop' || router.canGoBack());
  const isMobile = width < 768;

  const handleBack = () => {
    if (pathname === '/shop') {
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={20} tint={colorScheme} style={[styles.container, { borderBottomColor: colors.border }]}>
        <View style={styles.topRow}>
          <View style={styles.leftSection}>

            {/* Show back arrow on inner screens on all platforms */}
            {showBackButton && (
              <Pressable style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={26} color={colors.text} />
              </Pressable>
            )}
            <ThemedText style={[styles.logo, { color: colors.text }]}>LUMORA</ThemedText>
          </View>
          
          {Platform.OS === 'web' && !isMobile && (
            <View style={styles.navLinks}>
              <Pressable onPress={() => router.push('/(tabs)')}>
                <ThemedText style={styles.navLink}>Home</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.push('/shop' as any)}>
                <ThemedText style={styles.navLink}>Shop</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.push('/blog' as any)}>
                <ThemedText style={styles.navLink}>Blog</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.push('/contact' as any)}>
                <ThemedText style={styles.navLink}>Contact</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.push('/about' as any)}>
                <ThemedText style={styles.navLink}>About</ThemedText>
              </Pressable>
            </View>
          )}
          
          <View style={styles.rightIcons}>
            {/* Bell — mobile only, logged-in users only */}
            {Platform.OS !== 'web' && session && (
              <Pressable
                style={styles.iconButton}
                onPress={() => router.push('/notifications' as any)}
                accessibilityLabel="Notifications"
              >
                <View style={styles.bellWrapper}>
                  <Ionicons name="notifications-outline" size={24} color={colors.text} />
                  {unreadCount > 0 && (
                    <View style={styles.bellBadge}>
                      <Text style={styles.bellBadgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )}
            <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/profile')}>
              {session && avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarSmall}
                />
              ) : session ? (
                <View style={[styles.avatarSmallCircle, { backgroundColor: colors.tint }]}>
                  <ThemedText style={styles.avatarInitial}>
                    {session.user?.user_metadata?.username?.[0]?.toUpperCase() ||
                      session.user?.email?.[0]?.toUpperCase() || '?'}
                  </ThemedText>
                </View>
              ) : (
                <Ionicons name="person-outline" size={24} color={colors.text} />
              )}
            </Pressable>
            
            {Platform.OS === 'web' && !isMobile && !session && (
              <View style={styles.authContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Pressable onPress={() => router.push('/signin')}>
                  <ThemedText style={styles.loginText}>Log In</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </View>

      </BlurView>



    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 10 : 35,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
    backgroundColor: 'rgba(246, 241, 235, 0.9)',
    height: Platform.OS === 'web' ? 80 : 110,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerButton: {
    marginRight: 4,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    letterSpacing: 2,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 30,
  },
  navLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 1,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 2,
  },
  bellWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C9A96E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    color: '#2B1F14',
    lineHeight: 14,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#A06E50',
  },
  avatarSmallCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  authContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginLeft: 10,
  },
  divider: {
    width: 1,
    height: 15,
  },
  loginText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 1,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',  // full-screen dim backdrop
  },
  drawerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '75%',                          // takes ~75% from the left
    maxWidth: 320,
    backgroundColor: '#F6F1EB',
    paddingTop: Platform.OS === 'web' ? 24 : 60,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 }, // shadow cast to the right
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  drawerLogo: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    letterSpacing: 2,
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerLinks: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 6,
  },
  drawerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  drawerLinkText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCD8D3',
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FAF9F6',
    width: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111',
  },
});
