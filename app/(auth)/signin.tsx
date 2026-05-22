import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthInput } from '@/components/AuthInput';
import { HoverButton } from '@/components/HoverButton';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

import { ErrorNotice } from '@/components/ErrorNotice';

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Detect if the input is an email or a username
      const isEmail = email.includes('@');
      let loginEmail = email.trim();

      console.log(`[SignIn] Input: "${email}", isEmail: ${isEmail}`);

      if (!isEmail) {
        // Look up the email from the profiles table using the username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', email.trim())   // case-insensitive match
          .single();

        if (profileError || !profileData?.email) {
          setError('No account found with that username. Please use your email instead.');
          setLoading(false);
          return;
        }
        loginEmail = profileData.email.trim().toLowerCase();
        console.log(`[SignIn] Resolved username to email: ${loginEmail}`);
      } else {
        loginEmail = email.trim().toLowerCase();
      }

      console.log(`[SignIn] Attempting sign in with email: ${loginEmail}`);

      const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) {
        console.error('[SignIn] Auth error:', authError.message, authError.status);
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email address before signing in. Check your inbox.');
        } else {
          setError('Invalid email or password. Please try again.');
        }
      } else {
        console.log('[SignIn] Success, user:', signInData?.user?.email);
        
        // Resolve username to display on the welcome page
        let resolvedUsername = '';
        if (!isEmail) {
          resolvedUsername = email.trim();
        } else {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username')
              .eq('email', loginEmail.toLowerCase())
              .single();
            resolvedUsername = profileData?.username || '';
          } catch (e) {
            console.error('[SignIn] Profile fetch failed', e);
          }
        }

        // Wrap in setTimeout to let Supabase auth session update settle, preventing React Navigation race conditions on mobile
        setTimeout(() => {
          router.replace(`/(auth)/welcome?username=${encodeURIComponent(resolvedUsername)}` as any);
        }, 100);
      }
    } catch (err) {
      console.error('[SignIn] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formWrapper}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoPlaceholder, { borderColor: colors.tint }]}>
              <ThemedText style={styles.logoText}>LUMORA</ThemedText>
            </View>
            <ThemedText style={styles.subtitle}>Welcome back to luxury</ThemedText>
          </View>

          <View style={styles.form}>
            <ErrorNotice message={error} />
            
            <AuthInput
              label="Email or Username"
              placeholder="Enter your email or username"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(null); }}
              autoCapitalize="none"
              keyboardType="default"
            />
            <AuthInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => { setPassword(text); setError(null); }}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <ThemedText style={styles.forgotText}>Forgot Password?</ThemedText>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <HoverButton
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
              />
            </View>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <ThemedText style={styles.linkText}>Sign Up</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Platform.OS === 'web' ? Spacing.l : Spacing.m,
    paddingTop: Platform.OS === 'web' ? 100 : 60,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoPlaceholder: {
    width: 120,
    height: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  logoText: {
    letterSpacing: 8,
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  subtitle: {
    ...Typography.bodyText,
    opacity: 0.6,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.l,
  },
  forgotText: {
    ...Typography.smallText,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    marginTop: Spacing.m,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.bodyText,
    opacity: 0.6,
  },
  linkText: {
    ...Typography.bodyText,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
