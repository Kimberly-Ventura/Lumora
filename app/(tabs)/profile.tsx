import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user?.id) {
        const saved = await AsyncStorage.getItem(`avatar_${user.id}`);
        setAvatarUri(saved);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handlePickAvatar = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please allow access to your photo library to change your profile picture.'
          );
          return;
        }
      }

      setUploadingAvatar(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (user?.id) {
          await AsyncStorage.setItem(`avatar_${user.id}`, uri);
          setAvatarUri(uri);
        }
      }
    } catch (err) {
      console.error('[Profile] Error picking avatar:', err);
      Alert.alert('Error', 'Could not update profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (user?.id) {
      await AsyncStorage.removeItem(`avatar_${user.id}`);
      setAvatarUri(null);
    }
  };

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
            {/* Avatar with edit button */}
            <View style={styles.avatarWrapper}>
              <Pressable onPress={handlePickAvatar} style={styles.avatarPressable}>
                {uploadingAvatar ? (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.cardBackground, borderColor: colors.tint }]}>
                    <ActivityIndicator color={colors.tint} />
                  </View>
                ) : avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={[styles.avatarImage, { borderColor: colors.tint }]}
                  />
                ) : (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.cardBackground, borderColor: colors.tint }]}>
                    <Ionicons name="person" size={44} color={colors.icon} />
                  </View>
                )}
                {/* Camera overlay badge */}
                <View style={[styles.cameraBadge, { backgroundColor: colors.tint }]}>
                  <Ionicons name="camera" size={14} color="#FFF" />
                </View>
              </Pressable>

              {/* Remove photo button */}
              {avatarUri && (
                <Pressable onPress={handleRemoveAvatar} style={styles.removePhotoBtn}>
                  <ThemedText style={[styles.removePhotoText, { color: '#c0392b' }]}>
                    Remove photo
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <ThemedText style={styles.userName}>
              {user.user_metadata?.username || 'Guest'}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{user.email}</ThemedText>

            {/* Change profile picture hint */}
            <Pressable onPress={handlePickAvatar} style={[styles.changePhotoHint, { borderColor: colors.tint }]}>
              <Ionicons name="image-outline" size={16} color={colors.tint} />
              <ThemedText style={[styles.changePhotoText, { color: colors.tint }]}>
                {avatarUri ? 'Change Profile Picture' : 'Add Profile Picture'}
              </ThemedText>
            </Pressable>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ProfileRow icon="bag-outline" label="My Orders" colors={colors} onPress={() => {}} />
              <ProfileRow icon="heart-outline" label="Wishlist" colors={colors} onPress={() => router.push('/wishlist' as any)} />
              <ProfileRow icon="location-outline" label="Shipping Address" colors={colors} onPress={() => {}} />
              <ProfileRow icon="card-outline" label="Payment Methods" colors={colors} onPress={() => {}} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <ProfileRow icon="settings-outline" label="Settings" colors={colors} onPress={() => {}} />
              <ProfileRow icon="help-circle-outline" label="Help & Support" colors={colors} onPress={() => {}} />
              <ProfileRow icon="newspaper-outline" label="Blog" colors={colors} onPress={() => router.push('/blog' as any)} />
              <ProfileRow icon="mail-outline" label="Contact" colors={colors} onPress={() => router.push('/contact' as any)} />
              <ProfileRow icon="information-circle-outline" label="About" colors={colors} onPress={() => router.push('/about' as any)} />
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
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  removePhotoBtn: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removePhotoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textDecorationLine: 'underline',
  },
  changePhotoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  changePhotoText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    textTransform: 'capitalize',
  },
  userEmail: {
    ...Typography.bodyText,
    marginBottom: Spacing.xs,
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
