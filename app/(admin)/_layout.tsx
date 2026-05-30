import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useEffect, useState, createContext, useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AdminTheme } from '@/constants/theme';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { NotificationBell } from '@/components/NotificationBell';

// ─── Admin check ─────────────────────────────────────────────────────────────
// A user is considered an admin if their Supabase user_metadata has is_admin: true
// OR if their email matches the ADMIN_EMAIL constant below.
// Set is_admin: true via Supabase Dashboard → Authentication → Users → Edit user → Raw User Meta Data
// e.g.  { "is_admin": true }
const ADMIN_EMAIL = 'admin@gmail.com'; // ← change this to your actual admin email

function isAdminUser(session: Session | null): boolean {
  if (!session?.user) return false;
  const meta = session.user.user_metadata;
  if (meta?.is_admin === true) return true;
  if (session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;
  return false;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

const AdminSessionContext = createContext<Session | null>(null);

export function useAdminSession() {
  return useContext(AdminSessionContext);
}

// ─── Root layout export ───────────────────────────────────────────────────────

export default function AdminLayout() {
  return <AdminRoot />;
}

// ─── AdminRoot: loads session, then decides what to render ────────────────────

function AdminRoot() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
      // Real Supabase auth flow
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(data.session);
        }
        setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setLoading(false);
      });
      subscription = data.subscription;

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // ── Loading spinner ──
  if (loading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    );
  }

  // ── Check admin privileges ──
  // Even if there's a session (customer logged in), treat as unauthenticated
  // unless the user is actually an admin.
  const adminVerified = isAdminUser(session);

  if (!adminVerified) {
    // Show login screen with no shell, no sidebar
    return (
      <View style={{ flex: 1, backgroundColor: '#2B1F14' }}>
        <AdminTabs isAdmin={false} />
      </View>
    );
  }

  // ── Authenticated admin: full dashboard with shell ──
  return (
    <AdminSessionContext.Provider value={session}>
      <DashboardShell>
        <AdminTabs isAdmin={true} />
      </DashboardShell>
    </AdminSessionContext.Provider>
  );
}

// ─── Loading styles ───────────────────────────────────────────────────────────

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B1F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useAutoLock } from '@/hooks/use-auto-lock';

function DashboardShell({ children }: { children: React.ReactNode }) {
  useAutoLock();
  
  return (
    <View style={styles.webContainer}>
      <WebSidebar />
      <View style={styles.webContentWrapper}>
        <WebTopBar />
        <View style={{ flex: 1, backgroundColor: AdminTheme.background }}>
          {children}
        </View>
      </View>
    </View>
  );
}

function WebSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: 'grid',     route: '/(admin)'           },
    { icon: 'receipt',  route: '/(admin)/orders'    },
    { icon: 'cube',     route: '/(admin)/products'  },
    { icon: 'people',   route: '/(admin)/customers' },
    { icon: 'settings', route: '/(admin)/settings'  },
  ];

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarIcons}>
        {navItems.map((item) => {
          const cleanRoute = item.route.replace('/(admin)', '');
          const isActive =
            pathname === item.route ||
            (cleanRoute !== '' && pathname === cleanRoute) ||
            (item.route === '/(admin)' &&
              (pathname === '/(admin)/index' || pathname === '/(admin)' || pathname === '/' || pathname === '/index' || pathname === ''));
          return (
            <Pressable
              key={item.route}
              style={({ hovered }: any) => [
                styles.sidebarIconWrapper,
                isActive && styles.sidebarIconActive,
                hovered && !isActive && styles.sidebarIconHover,
              ]}
              onPress={() => router.push(item.route as any)}
            >
              {({ hovered }: any) => (
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
  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (Platform.OS === 'web') {
      window.location.reload(); 
    }
  };

  return (
    <View style={styles.topBar}>
      <Text style={styles.topBarTitle}>Lumora</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.adminLabel}>Admin</Text>
      <NotificationBell />
      <Pressable
        onPress={handleLogout}
        style={({ hovered }: any) => [
          { marginLeft: 12 },
          hovered && { opacity: 0.7 },
        ]}
        accessibilityLabel="Sign out"
      >
        <Ionicons name="lock-closed-outline" size={20} color="#8A9E85" />
      </Pressable>
    </View>
  );
}

// ─── Tabs navigator ───────────────────────────────────────────────────────────

function AdminTabs({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  // If not an admin and not already on login page, redirect to login
  useEffect(() => {
    if (!isAdmin && pathname !== '/(admin)/login') {
      router.replace('/(admin)/login' as any);
    }
  }, [isAdmin, pathname, router]);

  // If verified admin and somehow on the login page, redirect to dashboard
  useEffect(() => {
    if (isAdmin && (pathname === '/(admin)/login' || pathname.endsWith('/login'))) {
      router.replace('/(admin)' as any);
    }
  }, [isAdmin, pathname, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Regular',
          fontSize: 11,
        },
      }}
    >
      {/* Login is always registered */}
      <Tabs.Screen
        name="login"
        options={{
          href: isAdmin ? null : undefined,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen name="index"       options={{ href: isAdmin ? undefined : null, title: 'Overview'  }} />
      <Tabs.Screen name="orders"      options={{ href: isAdmin ? undefined : null, title: 'Orders'    }} />
      <Tabs.Screen name="products"    options={{ href: isAdmin ? undefined : null, title: 'Products'  }} />
      <Tabs.Screen name="customers"   options={{ href: isAdmin ? undefined : null, title: 'Customers' }} />
      <Tabs.Screen name="settings"    options={{ href: isAdmin ? undefined : null, title: 'Settings'  }} />
      <Tabs.Screen name="add-product" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    zIndex: 10,
    elevation: 10,
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
  },
});
