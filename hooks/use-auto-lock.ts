import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export function useAutoLock() {
  const timeoutRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const initAutoLock = async () => {
      try {
        const { data } = await supabase.from('store_settings').select('auto_lock, auto_lock_minutes').limit(1).single();
        if (!active) return;
        
        if (data && data.auto_lock && data.auto_lock_minutes > 0) {
          const timeoutMs = data.auto_lock_minutes * 60 * 1000;
          
          const resetTimer = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(async () => {
              // Lock the session
              await AsyncStorage.removeItem('mock_admin_session');
              await supabase.auth.signOut();
              if (Platform.OS === 'web') {
                window.location.reload();
              } else {
                router.replace('/(admin)/login');
              }
            }, timeoutMs);
          };

          // Initialize timer
          resetTimer();

          // Set up listeners
          if (Platform.OS === 'web') {
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
            events.forEach(e => document.addEventListener(e, resetTimer));
            
            return () => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              events.forEach(e => document.removeEventListener(e, resetTimer));
            };
          } else {
            // For native, we could use AppState or a global touch wrapper, but we'll just return cleanup
            return () => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
          }
        }
      } catch (e) {
        console.error('Error init auto lock:', e);
      }
    };

    initAutoLock();

    return () => {
      active = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router]);
}
