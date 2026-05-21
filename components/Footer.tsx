import React from 'react';
import { StyleSheet, View, Pressable, TextInput } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export function Footer() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.text }]}>
      <ThemedText style={[styles.logo, { color: colors.background }]}>LUMORA</ThemedText>
      
      <View style={styles.newsletter}>
        <ThemedText style={[styles.sectionTitle, { color: colors.background }]}>NEWSLETTER</ThemedText>
        <ThemedText style={[styles.description, { color: colors.background, opacity: 0.7 }]}>
          Subscribe to receive updates, access to exclusive deals, and more.
        </ThemedText>
        <View style={styles.inputContainer}>
          <TextInput 
            placeholder="Enter your email" 
            placeholderTextColor="rgba(255,255,255,0.5)" 
            style={[styles.input, { color: colors.background, borderBottomColor: colors.background }]} 
          />
          <Pressable style={styles.subscribeBtn}>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
          </Pressable>
        </View>
      </View>

      <View style={styles.linksContainer}>
        <View style={styles.linkColumn}>
          <ThemedText style={[styles.linkTitle, { color: colors.background }]}>EXPLORE</ThemedText>
          <ThemedText style={[styles.link, { color: colors.background }]}>Collection</ThemedText>
          <ThemedText style={[styles.link, { color: colors.background }]}>Best Sellers</ThemedText>
          <ThemedText style={[styles.link, { color: colors.background }]}>New Arrivals</ThemedText>
        </View>
        <View style={styles.linkColumn}>
          <ThemedText style={[styles.linkTitle, { color: colors.background }]}>SUPPORT</ThemedText>
          <ThemedText style={[styles.link, { color: colors.background }]}>Shipping</ThemedText>
          <ThemedText style={[styles.link, { color: colors.background }]}>Returns</ThemedText>
          <ThemedText style={[styles.link, { color: colors.background }]}>Contact Us</ThemedText>
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.socials}>
          <Ionicons name="logo-instagram" size={20} color={colors.background} />
          <Ionicons name="logo-facebook" size={20} color={colors.background} />
          <Ionicons name="logo-pinterest" size={20} color={colors.background} />
        </View>
        <ThemedText style={[styles.copyright, { color: colors.background, opacity: 0.5 }]}>
          © 2026 LUMORA. ALL RIGHTS RESERVED.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    paddingTop: 60,
  },
  logo: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    letterSpacing: 4,
    marginBottom: 40,
  },
  newsletter: {
    marginBottom: 60,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 15,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    height: 45,
    fontFamily: 'Inter-Regular',
  },
  subscribeBtn: {
    padding: 10,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 60,
  },
  linkColumn: {
    gap: 15,
  },
  linkTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
  link: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    opacity: 0.8,
  },
  bottom: {
    alignItems: 'center',
    gap: 30,
  },
  socials: {
    flexDirection: 'row',
    gap: 25,
  },
  copyright: {
    fontSize: 10,
    letterSpacing: 1,
  },
});
