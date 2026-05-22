import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_700Bold, PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { setupAuthErrorHandler } from '@/lib/supabase';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastNotificationContainer } from '@/components/ToastNotification';

// Register the global token-refresh error handler once at app startup
setupAuthErrorHandler();

export const unstable_settings = {
  // On web the admin is the entry point; on mobile the tabs are
  initialRouteName: Platform.OS === 'web' ? '(admin)' : '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const segments = useSegments();
  const isAdminRoute = segments[0] === '(admin)';

  // On web, if we land on a non-admin route redirect to admin
  if (Platform.OS === 'web' && !isAdminRoute) {
    return <Redirect href="/(admin)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
      <Stack.Screen name="(admin)"     options={{ headerShown: false }} />
      <Stack.Screen name="(auth)"      options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="about"       options={{ headerShown: false }} />
      <Stack.Screen name="wishlist"    options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="shop"        options={{ headerShown: false }} />
      <Stack.Screen name="blog"        options={{ headerShown: false }} />
      <Stack.Screen name="contact"     options={{ headerShown: false }} />
      <Stack.Screen name="product-list" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="modal"       options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'CormorantGaramond-Bold': CormorantGaramond_700Bold,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Bold': DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppContent />
          <ToastNotificationContainer />
          <StatusBar style="auto" />
        </ThemeProvider>
      </NotificationProvider>
    </GestureHandlerRootView>
  );
}
