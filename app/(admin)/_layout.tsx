import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useEffect, useState, createContext, useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AdminTheme } from '@/constants/theme';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { NotificationBell } from '@/components/NotificationBell';

// ─── Auth Context ────────────────────────────────────────────────────────────

const AdminSessionContext = createContext<Session | null>(null);

export function useAdminSession() {
  return useContext(AdminSessionContext);
}

// ─── Root layout export ──────────────────────────────────────────────────────

export default function AdminLayout() {
  return <AdminRoot />;
}

// ─── AdminRoot: loads session, then decides what to render ───────────────────

function AdminRoot() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isOnLoginScreen = pathname === '/(admin)/login';

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setLoading(false);
        } else {
          setSession(newSession);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Still checking session ──
  if (loading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#C9A96E" />
      </View>
    );
  }

  // ── No session: show login standalone (no shell, no sidebar) ──
  if (!session) {
    return <AdminTabs session={null} />;
  }

  // ── Has session but somehow on login: redirect to dashboard ──
  if (isOnLoginScreen) {
    return <RedirectToDashboard />;
  }

  // ── Authenticated: full dashboard with shell ──
  return (
    <AdminSessionContext.Provider value={session}>
      <DashboardShell>
        <AdminTabs session={session} />
      </DashboardShell>
    </AdminSessionContext.Provider>
  );
}

// Redirects to dashboard after login
function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(admin)' as any);
  }, []);
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color="#C9A96E" />
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B1F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Dashboard shell (sidebar + topbar) ─────────────────────────────────────

function DashboardShell({ children }: { children: React.ReactNode }) {
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
          const isActive =
            pathname === item.route ||
            (item.route === '/(admin)' &&
              (pathname === '/(admin)/index' || pathname === '/(admin)'));
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
                  name={
                    (isActive ? item.icon : `${item.icon}-outline`) as any
                  }
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
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(admin)/login' as any);
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

// ─── Tabs navigator ──────────────────────────────────────────────────────────

function AdminTabs({ session }: { session: Session | null }) {
  const isAuthenticated = !!session;
  const router = useRouter();
  const pathname = usePathname();

  // If not authenticated and not already on login, navigate there
  useEffect(() => {
    if (!isAuthenticated && pathname !== '/(admin)/login') {
      router.replace('/(admin)/login' as any);
    }
  }, [isAuthenticated, pathname]);

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
      <Tabs.Screen
        name="login"
        options={{
          href: isAuthenticated ? null : undefined,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen name="index"       options={{ href: isAuthenticated ? undefined : null, title: 'Overview'  }} />
      <Tabs.Screen name="orders"      options={{ href: isAuthenticated ? undefined : null, title: 'Orders'    }} />
      <Tabs.Screen name="products"    options={{ href: isAuthenticated ? undefined : null, title: 'Products'  }} />
      <Tabs.Screen name="customers"   options={{ href: isAuthenticated ? undefined : null, title: 'Customers' }} />
      <Tabs.Screen name="settings"    options={{ href: isAuthenticated ? undefined : null, title: 'Settings'  }} />
      <Tabs.Screen name="add-product" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  },
});
