import { Tabs, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, useWindowDimensions, View, Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCart } from '@/lib/cartHelper';
import { getWishlist } from '@/lib/wishlistHelper';
import { useNotificationListener } from '@/hooks/useNotificationListener';
import { supabase } from '@/lib/supabase';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();

  const router = useRouter();

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Set up real-time notification listener
  useNotificationListener(userId);

  useEffect(() => {
    // Get current user ID
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

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

  const showTabBar = true;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 10,
          display: showTabBar ? 'flex' : 'none',
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 10,
          letterSpacing: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/product-list' as any);
          },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? 'bag' : 'bag-outline'} size={24} color={color} />
              {cartCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -6,
                  backgroundColor: '#D4A373', // Earthy tone
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: colors.background
                }}>
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>{cartCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
              {wishlistCount > 0 && (
                <View style={{
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
                  borderColor: colors.background
                }}>
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>{wishlistCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/wishlist' as any);
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
