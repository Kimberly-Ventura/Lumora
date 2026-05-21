import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Pressable, Platform, useWindowDimensions, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const [session, setSession] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-320)).current; // starts off-screen left

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -320,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

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
        <View style={styles.leftSection}>
          {/* Show hamburger on ALL platforms when mobile and at a root screen */}
          {isMobile && isRootScreen && (
            <Pressable style={styles.hamburgerButton} onPress={openDrawer}>
              <Ionicons name="menu-outline" size={24} color={colors.text} />
            </Pressable>
          )}
          {/* Show back arrow on inner screens on all platforms */}
          {showBackButton && (
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
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
          {(!isMobile || width > 360) && (
            <Pressable style={styles.iconButton} onPress={() => router.push('/wishlist' as any)}>
              <Ionicons name="heart-outline" size={20} color={colors.text} />
            </Pressable>
          )}
          {!isMobile && (
            <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/profile')}>
              <Ionicons name="person-outline" size={20} color={colors.text} />
            </Pressable>
          )}
          <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="bag-outline" size={20} color={colors.text} />
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
      </BlurView>

      {/* Left-side slide-in Drawer — animates horizontally via Animated.Value */}
      <Modal
        animationType="none"
        transparent={true}
        visible={drawerVisible}
        onRequestClose={closeDrawer}
        statusBarTranslucent
      >
        {/* Full-screen dim backdrop — tap anywhere outside panel to close */}
        <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
          {/* Stop tap propagation so touching inside panel doesn't close it */}
          <Animated.View
            style={[styles.drawerContent, { transform: [{ translateX: slideAnim }] }]}
          >
            <Pressable onPress={() => {}} style={{ flex: 1 }}>
              {/* Panel header */}
              <View style={styles.drawerHeader}>
                <ThemedText style={styles.drawerLogo}>LUMORA</ThemedText>
                <Pressable onPress={closeDrawer} style={styles.drawerCloseBtn} hitSlop={12}>
                  <Ionicons name="close" size={22} color="#111" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.drawerLinks} showsVerticalScrollIndicator={false}>
                {/* Main nav */}
                <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/(tabs)'), 250); }}>
                  <Ionicons name="home-outline" size={20} color="#333" />
                  <ThemedText style={styles.drawerLinkText}>Home</ThemedText>
                </Pressable>
                <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/(tabs)/shop' as any), 250); }}>
                  <Ionicons name="grid-outline" size={20} color="#333" />
                  <ThemedText style={styles.drawerLinkText}>Shop</ThemedText>
                </Pressable>
                <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/blog' as any), 250); }}>
                  <Ionicons name="newspaper-outline" size={20} color="#333" />
                  <ThemedText style={styles.drawerLinkText}>Blog</ThemedText>
                </Pressable>
                <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/contact' as any), 250); }}>
                  <Ionicons name="mail-outline" size={20} color="#333" />
                  <ThemedText style={styles.drawerLinkText}>Contact</ThemedText>
                </Pressable>
                <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/about' as any), 250); }}>
                  <Ionicons name="information-circle-outline" size={20} color="#333" />
                  <ThemedText style={styles.drawerLinkText}>About</ThemedText>
                </Pressable>

                <View style={styles.drawerDivider} />

                <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/wishlist' as any), 250); }}>
                  <Ionicons name="heart-outline" size={20} color="#333" />
                  <ThemedText style={styles.drawerLinkText}>Wishlist</ThemedText>
                </Pressable>
                <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/(tabs)/profile'), 250); }}>
                  <Ionicons name="person-outline" size={20} color="#333" />
                  <ThemedText style={styles.drawerLinkText}>My Profile</ThemedText>
                </Pressable>
                <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/(tabs)/cart'), 250); }}>
                  <Ionicons name="bag-outline" size={20} color="#333" />
                  <ThemedText style={styles.drawerLinkText}>My Bag (Cart)</ThemedText>
                </Pressable>
                {!session && (
                  <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/(admin)/pin'), 250); }}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#333" />
                    <ThemedText style={styles.drawerLinkText}>Admin Portal</ThemedText>
                  </Pressable>
                )}

                <View style={styles.drawerDivider} />

                {session ? (
                  <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); supabase.auth.signOut(); setTimeout(() => router.push('/signin'), 250); }}>
                    <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
                    <ThemedText style={[styles.drawerLinkText, { color: '#E74C3C' }]}>Sign Out</ThemedText>
                  </Pressable>
                ) : (
                  <Pressable style={styles.drawerLinkRow} onPress={() => { closeDrawer(); setTimeout(() => router.push('/signin'), 250); }}>
                    <Ionicons name="log-in-outline" size={20} color="#333" />
                    <ThemedText style={styles.drawerLinkText}>Log In</ThemedText>
                  </Pressable>
                )}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'web' ? 15 : 60,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
    backgroundColor: 'rgba(246, 241, 235, 0.9)',
    height: Platform.OS === 'web' ? 70 : 110,
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
    gap: 15,
  },
  iconButton: {
    padding: 4,
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
});
