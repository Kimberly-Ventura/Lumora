import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthInput } from '@/components/AuthInput';
import { HoverButton } from '@/components/HoverButton';
import { supabase } from '@/lib/supabase';

import { ErrorNotice } from '@/components/ErrorNotice';

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    setSuccess(null);
    if (!email || !username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (authError) {
        console.error('Sign up error:', authError.message);
        setError(authError.message);
        return;
      }

      if (data?.user) {
        // Save username -> email mapping to the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
          });

        if (profileError) {
          console.error('Profile creation error:', profileError.message);
          // Don't block the user — account was created, profile save failed silently
        }
      }

      // Account created — redirect to sign-in page
      setSuccess('Account created! Please sign in.');
      setTimeout(() => router.replace('/signin'), 1500);
    } catch (err) {
      console.error('Unexpected error during sign up:', err);
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
            <ThemedText style={styles.subtitle}>Join the circle of luxury</ThemedText>
          </View>

          <View style={styles.form}>
            <ErrorNotice message={error} />
            {success && (
              <View style={[styles.successContainer, { backgroundColor: '#F0FFF4', borderColor: '#9AE6B4' }]}>
                <ThemedText style={styles.successText}>{success}</ThemedText>
              </View>
            )}
            
            <AuthInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text: string) => { setEmail(text); setError(null); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <AuthInput
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={(text: string) => { setUsername(text); setError(null); }}
              autoCapitalize="none"
            />
            <AuthInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text: string) => { setPassword(text); setError(null); }}
              secureTextEntry
            />
            <AuthInput
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={(text: string) => { setConfirmPassword(text); setError(null); }}
              secureTextEntry
            />

            <View style={styles.buttonContainer}>
              <HoverButton
                title="Sign Up"
                onPress={handleSignUp}
                loading={loading}
              />
            </View>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/signin')}>
                <ThemedText style={styles.linkText}>Sign In</ThemedText>
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
    paddingTop: Platform.OS === 'web' ? 80 : 40,
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
    marginBottom: Spacing.xl,
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
  buttonContainer: {
    marginTop: Spacing.m,
  },
  successContainer: {
    padding: Spacing.s,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.m,
  },
  successText: {
    ...Typography.smallText,
    color: '#2F855A',
    textAlign: 'center',
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
