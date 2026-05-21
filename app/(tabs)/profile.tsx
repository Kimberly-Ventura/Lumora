import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      if (user?.id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('[Profile] Error updating profile on logout:', updateError.message);
        }
      }
    } catch (err) {
      console.error('[Profile] Unexpected error updating profile on logout:', err);
    } finally {
      await supabase.auth.signOut();
      router.replace('/signin');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>MY PROFILE</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: Spacing.xl }} />
        ) : user ? (
          <>
            {/* Avatar */}
            <View style={[styles.avatarCircle, { backgroundColor: colors.cardBackground, borderColor: colors.tint }]}>
              <Ionicons name="person" size={44} color={colors.icon} />
            </View>

            <ThemedText style={styles.userName}>
              {user.user_metadata?.username || 'Guest'}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{user.email}</ThemedText>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ProfileRow icon="bag-outline" label="My Orders" colors={colors} />
              <ProfileRow icon="heart-outline" label="Wishlist" colors={colors} />
              <ProfileRow icon="location-outline" label="Shipping Address" colors={colors} />
              <ProfileRow icon="card-outline" label="Payment Methods" colors={colors} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ProfileRow icon="settings-outline" label="Settings" colors={colors} />
              <ProfileRow icon="help-circle-outline" label="Help & Support" colors={colors} />
            </View>

            <Pressable
              style={[styles.signOutButton, { borderColor: '#c0392b' }]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={18} color="#c0392b" />
              <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
            </Pressable>
          </>
        ) : (
          <View style={styles.guestContainer}>
            <Ionicons name="person-circle-outline" size={80} color={colors.icon} />
            <ThemedText style={styles.guestTitle}>Welcome to Lumora</ThemedText>
            <ThemedText style={styles.guestSubtitle}>
              Sign in to access your profile, orders, and wishlist.
            </ThemedText>
            <Pressable
              style={[styles.signInButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/signin')}
            >
              <ThemedText style={[styles.signInButtonText, { color: colors.background }]}>
                SIGN IN
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => router.push('/signup')}>
              <ThemedText style={[styles.createAccountText, { color: colors.icon }]}>
                Create an account
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function ProfileRow({ icon, label, colors, onPress }: { icon: any; label: string; colors: any; onPress?: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.icon} />
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      </View>
      <Ionicons name="chevron-forward-outline" size={16} color={colors.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingTop: 60,
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: {
    ...Typography.cardTitle,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  placeholder: { width: 30 },
  content: {
    alignItems: 'center',
    padding: Spacing.m,
    paddingTop: Spacing.l,
    gap: Spacing.s,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    textTransform: 'capitalize',
  },
  userEmail: {
    ...Typography.bodyText,
    marginBottom: Spacing.s,
  },
  card: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.s,
    paddingVertical: 12,
    paddingHorizontal: Spacing.l,
    borderWidth: 1,
    borderRadius: 4,
  },
  signOutText: {
    color: '#c0392b',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 1,
  },
  guestContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    gap: Spacing.s,
  },
  guestTitle: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
  },
  guestSubtitle: {
    ...Typography.bodyText,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  signInButton: {
    marginTop: Spacing.s,
    paddingVertical: 14,
    paddingHorizontal: Spacing.l,
    borderRadius: 2,
  },
  signInButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 2,
  },
  createAccountText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
