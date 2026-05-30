import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ConfettiCannon count={150} origin={{ x: -10, y: 0 }} fallSpeed={2500} fadeOut />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="checkmark" size={48} color="#27AE60" />
          </View>
        </View>

        <ThemedText style={styles.title}>ORDER PLACED</ThemedText>
        <ThemedText style={styles.subtitle}>
          Thank you for your purchase. We've received your order and are currently processing it.
        </ThemedText>

        <View style={[styles.card, { borderColor: colors.border, backgroundColor: '#F9F8F6' }]}>
          <ThemedText style={styles.cardLabel}>ORDER NUMBER</ThemedText>
          <ThemedText style={styles.orderId}>{orderId || '#ORD-PENDING'}</ThemedText>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <ThemedText style={styles.cardLabel}>ESTIMATED DELIVERY</ThemedText>
          <ThemedText style={styles.deliveryText}>3 - 5 Business Days</ThemedText>
        </View>

        <Pressable 
          style={[styles.primaryButton, { backgroundColor: '#111' }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <ThemedText style={styles.primaryButtonText}>BACK TO HOME</ThemedText>
        </Pressable>
        
        <Pressable 
          style={styles.secondaryButton}
          onPress={() => router.replace('/product-list' as any)}
        >
          <ThemedText style={styles.secondaryButtonText}>CONTINUE SHOPPING</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    paddingTop: 80,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.cardTitle,
    fontSize: 24,
    letterSpacing: 3,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyText,
    textAlign: 'center',
    color: '#666',
    marginBottom: Spacing.xl,
    lineHeight: 24,
    maxWidth: 400,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: 40,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#666',
    letterSpacing: 2,
    marginBottom: Spacing.s,
  },
  orderId: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111',
    letterSpacing: 1,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: Spacing.l,
  },
  deliveryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  primaryButton: {
    width: '100%',
    maxWidth: 400,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
  secondaryButton: {
    paddingVertical: Spacing.m,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
    color: '#111',
  },
});
