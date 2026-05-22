import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage wrapper — handles web localStorage and native AsyncStorage
const ExpoSqliteStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') return localStorage.getItem(key);
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSqliteStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Call this once at app startup.
 * Supabase v2 doesn't expose a TOKEN_REFRESH_FAILED event — instead it
 * fires SIGNED_OUT after a failed refresh. We listen for that and ensure
 * any stale storage is cleared so the user lands on the login screen.
 */
export function setupAuthErrorHandler() {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      // Clear any persisted session keys so stale tokens don't linger
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sb-'))
          .forEach((k) => localStorage.removeItem(k));
      }
    }
  });
}
