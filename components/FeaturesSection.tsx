import React from 'react';
import { StyleSheet, View, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && width > 768;

const FEATURES = [
  {
    id: '1',
    icon: 'cube-outline',
    title: 'Fast & Reliable Delivery',
    desc: 'Get your luxury furniture delivered quickly and safely, right to your doorstep.',
  },
  {
    id: '2',
    icon: 'bag-check-outline',
    title: 'Easy Shopping',
    desc: 'Get your luxury furniture delivered quickly and safely, right to your doorstep.',
  },
  {
    id: '3',
    icon: 'car-outline',
    title: 'Fast & Reliable Delivery',
    desc: 'Get your luxury furniture delivered quickly and safely, right to your doorstep.',
  },
  {
    id: '4',
    icon: 'reload-outline',
    title: 'Fast & Reliable Delivery',
    desc: 'Get your luxury furniture delivered quickly and safely, right to your doorstep.',
  },
];

export function FeaturesSection() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, isWeb && styles.containerWeb]}>
      <View style={[styles.contentLeft, isWeb && styles.contentLeftWeb]}>
        <ThemedText style={[styles.title, Typography.sectionHeading, { color: colors.text }]}>
          WHY CUSTOMERS{'\n'}CHOOSE LUMORA
        </ThemedText>
        <ThemedText style={[styles.subtitle, Typography.bodyText]}>
          experience the perfect blend of luxury, quality,{'\n'}and design in every piece.
        </ThemedText>

        <View style={styles.featuresGrid}>
          {FEATURES.map((feat) => (
            <View key={feat.id} style={styles.featureItem}>
              <Ionicons name={feat.icon as any} size={24} color={colors.text} style={styles.featureIcon} />
              <ThemedText style={[styles.featureTitle, { color: colors.text }]}>{feat.title}</ThemedText>
              <ThemedText style={[styles.featureDesc, Typography.bodyText]}>{feat.desc}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.imageContainer, isWeb && styles.imageContainerWeb]}>
        <Image 
          source={require('@/assets/images/why_choose_table.png')} 
          style={styles.image} 
          resizeMode="cover" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 80,
    flexDirection: 'column',
    gap: 40,
  },
  containerWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  contentLeft: {
    width: '100%',
  },
  contentLeftWeb: {
    width: '45%',
    paddingRight: 40,
  },
  title: {
    marginBottom: 20,
    lineHeight: 40,
  },
  subtitle: {
    marginBottom: 60,
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
    rowGap: 40,
  },
  featureItem: {
    width: isWeb ? '45%' : '100%',
  },
  featureIcon: {
    marginBottom: 15,
  },
  featureTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 10,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainerWeb: {
    width: '50%',
    height: 600,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
