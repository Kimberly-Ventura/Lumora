import { Tabs, Redirect, useRouter, useSegments, usePathname } from 'expo-router';
import React, { createContext, useContext, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AdminTheme } from '@/constants/theme';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';

const AdminAuthContext = createContext<any>(null);

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export default function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const login = () => {
    setIsAuthenticated(true);
    router.replace('/(admin)');
  };

  const logout = () => {
    setIsAuthenticated(false);
    router.replace('/(admin)/pin');
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <AdminTabs />
    </AdminAuthContext.Provider>
  );
}

function WebSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const navItems = [
    { name: 'index', icon: 'grid', route: '/(admin)' },
    { name: 'orders', icon: 'receipt', route: '/(admin)/orders' },
    { name: 'products', icon: 'cube', route: '/(admin)/products' },
    { name: 'customers', icon: 'people', route: '/(admin)/customers' },
    { name: 'settings', icon: 'settings', route: '/(admin)/settings' },
  ];

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarIcons}>
        {navItems.map((item) => {
          const isActive = pathname === item.route || (item.route === '/(admin)' && pathname === '/(admin)/index');
          return (
            <Pressable 
              key={item.name} 
              style={({ hovered }) => [
                styles.sidebarIconWrapper, 
                isActive && styles.sidebarIconActive,
                hovered && !isActive && styles.sidebarIconHover
              ]}
              onPress={() => router.push(item.route as any)}
            >
              {({ hovered }) => (
                <Ionicons 
                  name={(isActive ? item.icon : `${item.icon}-outline`) as any} 
                  size={24} 
                  color={isActive ? '#C9A96E' : hovered ? '#A69B8F' : '#7A6A5A'} 
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WebTopBar() {
  const { logout } = useAdminAuth();
  return (
    <View style={styles.topBar}>
      <Text style={styles.topBarTitle}>Lumora</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.adminLabel}>Admin</Text>
      <Pressable onPress={logout} style={({ hovered }) => [{ marginLeft: 16 }, hovered && { opacity: 0.7 }]}>
        <Ionicons name="lock-closed-outline" size={20} color="#8A9E85" />
      </Pressable>
    </View>
  );
}

function AdminTabs() {
  const { isAuthenticated } = useAdminAuth();
  const segments = useSegments();
  const isPinScreen = segments[segments.length - 1] === 'pin';

  // If not authenticated and NOT already on the PIN screen, redirect to PIN
  if (!isAuthenticated && !isPinScreen) {
    return <Redirect href="/(admin)/pin" />;
  }

  const isWeb = Platform.OS === 'web';
  const showWebLayout = isWeb && !isPinScreen;

  const content = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AdminTheme.accent,
        tabBarInactiveTintColor: AdminTheme.secondary,
        tabBarStyle: isWeb ? { display: 'none' } : {
          backgroundColor: AdminTheme.primaryDark,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Regular',
          fontSize: 11,
          marginTop: 4,
        },
      }}>
      
      {/* Hidden PIN Screen Tab */}
      <Tabs.Screen
        name="pin"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* Visible Tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );

  if (showWebLayout) {
    return (
      <View style={styles.webContainer}>
        <WebSidebar />
        <View style={styles.webContentWrapper}>
          <WebTopBar />
          <View style={{ flex: 1, backgroundColor: AdminTheme.background }}>
            {content}
          </View>
        </View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2B1F14',
  },
  webContentWrapper: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#F5F0E8',
  },
  sidebar: {
    width: 52,
    backgroundColor: '#2B1F14',
    alignItems: 'center',
    paddingTop: 24,
  },
  sidebarIcons: {
    alignItems: 'center',
    gap: 24,
    marginTop: 40,
  },
  sidebarIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarIconActive: {
    backgroundColor: 'rgba(201,169,110,0.1)',
  },
  sidebarIconHover: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  topBar: {
    height: 64,
    backgroundColor: '#2B1F14',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topBarTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 24,
    color: '#C9A96E',
  },
  adminLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#8A9E85',
  }
});
