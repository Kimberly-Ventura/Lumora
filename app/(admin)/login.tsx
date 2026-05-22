import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError('Invalid email or password.');
        setLoading(false);
      } else if (data.session) {
        // Navigate directly — don't rely on layout re-render
        router.replace('/(admin)' as any);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.brandBlock}>
            <Text style={styles.logo}>Lumora</Text>
            <Text style={styles.portalLabel}>Admin Portal</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSubtitle}>
              Enter your admin credentials to continue
            </Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@lumora.com"
                placeholderTextColor="#A09080"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor="#A09080"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                  editable={!loading}
                />
                <Pressable
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((p) => !p)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#7A6A5A"
                  />
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Sign in button */}
            <Pressable
              style={({ pressed }) => [
                styles.signInBtn,
                pressed && styles.signInBtnPressed,
                loading && styles.signInBtnDisabled,
              ]}
              onPress={handleSignIn}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              {loading ? (
                <ActivityIndicator color="#2B1F14" />
              ) : (
                <Text style={styles.signInBtnText}>Sign in</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.footerText}>LUMORA ADMIN</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2B1F14',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 56,
    color: '#C9A96E',
    letterSpacing: 1,
  },
  portalLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#7A6A5A',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#F5F0E8',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
  },
  cardTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 28,
    color: '#2B1F14',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#7A6A5A',
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#7A6A5A',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#EDE8DF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#2B1F14',
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
  },
  errorText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#C0392B',
    marginBottom: 16,
    textAlign: 'center',
  },
  signInBtn: {
    backgroundColor: '#C9A96E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signInBtnPressed: {
    opacity: 0.85,
  },
  signInBtnDisabled: {
    opacity: 0.6,
  },
  signInBtnText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#2B1F14',
    letterSpacing: 0.5,
  },
  footerText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    letterSpacing: 4,
    color: '#4A3828',
    marginTop: 36,
  },
});
