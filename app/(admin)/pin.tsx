import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuth } from './_layout';

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PIN = '1234';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000; // 30 seconds

export default function AdminPinScreen() {
  const [correctPin, setCorrectPin] = useState(DEFAULT_PIN);
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const { login } = useAdminAuth();
  
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadPin = async () => {
      try {
        const storedPin = await AsyncStorage.getItem('admin_pin');
        if (storedPin) {
          setCorrectPin(storedPin);
        }
      } catch (e) {
        console.error('Error loading PIN', e);
      }
    };
    loadPin();
  }, []);

  // Global Keyboard Listener for Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockoutTime) return;
      
      if (e.key >= '0' && e.key <= '9') {
        handlePress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handlePress('delete');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, lockoutTime]); // Re-bind to capture latest state

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutTime(null);
          setAttempts(0);
          setCountdown(0);
          clearInterval(interval);
        } else {
          setCountdown(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handlePress = (value: string) => {
    if (lockoutTime) return;

    if (value === 'delete') {
      setPin(prev => prev.slice(0, -1));
      return;
    }

    if (pin.length < 4) {
      const newPin = pin + value;
      setPin(newPin);

      if (newPin.length === 4) {
        if (newPin === correctPin) {
          setPin('');
          setAttempts(0);
          login();
        } else {
          triggerShake();
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setPin('');
          
          if (newAttempts >= MAX_ATTEMPTS) {
            setLockoutTime(Date.now() + LOCKOUT_DURATION);
            setCountdown(LOCKOUT_DURATION / 1000);
          }
        }
      }
    }
  };

  const renderDot = (index: number) => {
    const isFilled = pin.length > index;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          isFilled ? styles.dotFilled : styles.dotUnfilled,
        ]}
      />
    );
  };

  const renderButton = (value: string, label?: string | React.ReactNode) => {
    if (!value && !label) return <View style={styles.padButtonEmpty} />;
    
    return (
      <Pressable
        onPress={() => handlePress(value)}
        disabled={!!lockoutTime}
        style={({ pressed }) => [
          styles.padButton,
          pressed && !lockoutTime ? styles.padButtonPressed : null,
          lockoutTime ? styles.padButtonDisabled : null
        ]}
      >
        {({ pressed }) => (
          typeof label === 'string' || value !== 'delete' ? (
            <Text style={[
              styles.padButtonText,
              pressed && !lockoutTime ? styles.padButtonTextPressed : null,
              lockoutTime ? styles.padButtonTextDisabled : null
            ]}>
              {label || value}
            </Text>
          ) : (
            <Ionicons 
              name="backspace-outline" 
              size={28} 
              color={pressed && !lockoutTime ? '#FFF' : AdminTheme.primaryDark} 
              style={lockoutTime ? { opacity: 0.3 } : {}}
            />
          )
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Lumora</Text>
        <Text style={styles.subtitle}>Admin Access</Text>
      </View>

      <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnimation }] }]}>
        {[0, 1, 2, 3].map(renderDot)}
      </Animated.View>

      <View style={styles.statusContainer}>
        {lockoutTime ? (
          <Text style={styles.errorText}>Too many attempts. Try again in {countdown}s.</Text>
        ) : attempts > 0 ? (
          <Text style={styles.errorText}>Incorrect PIN. {MAX_ATTEMPTS - attempts} attempts left.</Text>
        ) : (
          <Text style={styles.statusText}>Enter your 4-digit PIN</Text>
        )}
      </View>

      {Platform.OS !== 'web' && (
        <View style={styles.padContainer}>
          <View style={styles.padRow}>
            {renderButton('1')}
            {renderButton('2')}
            {renderButton('3')}
          </View>
          <View style={styles.padRow}>
            {renderButton('4')}
            {renderButton('5')}
            {renderButton('6')}
          </View>
          <View style={styles.padRow}>
            {renderButton('7')}
            {renderButton('8')}
            {renderButton('9')}
          </View>
          <View style={styles.padRow}>
            {renderButton('', '')}
            {renderButton('0')}
            {renderButton('delete', 'delete')}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AdminTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 48,
    color: AdminTheme.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: AdminTheme.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 30,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotUnfilled: {
    backgroundColor: AdminTheme.surface,
  },
  dotFilled: {
    backgroundColor: AdminTheme.accent,
  },
  statusContainer: {
    height: 24,
    marginBottom: 40,
  },
  statusText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: AdminTheme.textMuted,
  },
  errorText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#D9534F',
  },
  padContainer: {
    width: 280,
    gap: 16,
  },
  padRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  padButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AdminTheme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padButtonPressed: {
    backgroundColor: AdminTheme.primaryDark,
  },
  padButtonDisabled: {
    opacity: 0.5,
  },
  padButtonEmpty: {
    width: 72,
    height: 72,
  },
  padButtonText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 28,
    color: AdminTheme.primaryDark,
  },
  padButtonTextPressed: {
    color: '#FFFFFF',
  },
  padButtonTextDisabled: {
    color: AdminTheme.textMuted,
  },
});
