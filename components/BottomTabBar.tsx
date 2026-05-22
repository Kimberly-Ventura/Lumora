import React, { useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCart } from '@/lib/cartHelper';
import { getWishlist } from '@/lib/wishlistHelper';

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const cartItems = await getCart();
        const wlItems = await getWishlist();
        setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
        setWishlistCount(wlItems.length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 2000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (route: string) => pathname === route || pathname.startsWith(route);

  const tabs = [
    {
      label: 'Home',
      icon: (active: boolean, color: string) => (
        <Ionicons name={active ? 'home' : 'home-outline'} size={24} color={color} />
      ),
      onPress: () => router.push('/(tabs)' as any),
      route: '/(tabs)',
    },
    {
      label: 'Explore',
      icon: (active: boolean, color: string) => (
        <Ionicons name={active ? 'search' : 'search-outline'} size={24} color={color} />
      ),
      onPress: () => router.push('/product-list' as any),
      route: '/product-list',
    },
    {
      label: 'Cart',
      icon: (active: boolean, color: string) => (
        <View>
          <Ionicons name={active ? 'bag' : 'bag-outline'} size={24} color={color} />
          {cartCount > 0 && (
            <View style={[styles.badge, { borderColor: colors.background }]}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
      ),
      onPress: () => router.push('/(tabs)/cart' as any),
      route: '/(tabs)/cart',
    },
    {
      label: 'Wishlist',
      icon: (active: boolean, color: string) => (
        <View>
          <Ionicons name={active ? 'heart' : 'heart-outline'} size={24} color={color} />
          {wishlistCount > 0 && (
            <View style={[styles.wishBadge, { borderColor: colors.background }]}>
              <Text style={styles.badgeText}>{wishlistCount}</Text>
            </View>
          )}
        </View>
      ),
      onPress: () => router.push('/wishlist' as any),
      route: '/wishlist',
    },
    {
      label: 'Profile',
      icon: (active: boolean, color: string) => (
        <Ionicons name={active ? 'person' : 'person-outline'} size={24} color={color} />
      ),
      onPress: () => router.push('/(tabs)/profile' as any),
      route: '/(tabs)/profile',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        const color = active ? colors.tabIconSelected : colors.tabIconDefault;
        return (
          <Pressable
            key={tab.label}
            style={styles.tab}
            onPress={tab.onPress}
          >
            {tab.icon(active, color)}
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 6,
    paddingBottom: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#D4A373',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  wishBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#D9534F',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
