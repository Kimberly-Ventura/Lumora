import React from 'react';
import { StyleSheet, View, ScrollView, Image, Dimensions, Platform } from 'react-native';
import { Header } from '@/components/Header';
import { FooterHero } from '@/components/FooterHero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: windowWidth } = Dimensions.get('window');

export default function AboutScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isWeb = Platform.OS === 'web';
  const contentWidth = isWeb ? Math.min(windowWidth, 1200) : windowWidth;
  const headerHeight = isWeb ? 70 : 110;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: headerHeight },
          isWeb && styles.webScrollContent
        ]}
      >
        {/* Banner Hero */}
        <View style={styles.heroSection}>
          <Image 
            source={require('@/assets/images/hero-sofa.png')} 
            style={styles.heroImage} 
            resizeMode="cover"
          />
          <View style={styles.overlay} />
          <View style={styles.heroTextContainer}>
            <ThemedText style={styles.heroSubtitle}>LUMORA HERITAGE</ThemedText>
            <ThemedText style={styles.heroTitle}>Quiet Luxury,{'\n'}Lasting Comfort</ThemedText>
          </View>
        </View>

        {/* Narrative Block */}
        <View style={[styles.narrativeContainer, { width: contentWidth }]}>
          <View style={styles.block}>
            <ThemedText style={styles.blockLabel}>OUR STORY</ThemedText>
            <ThemedText style={styles.blockHeading}>Crafting Elegance for the Modern Home</ThemedText>
            <ThemedText style={styles.blockText}>
              Founded on the principles of quiet luxury, Lumora was born from a desire to bring together understated elegance, masterful craftsmanship, and premium organic materials. We believe that furniture is more than just utilitarian—it is the canvas of your daily life, the anchor of your comfort, and an expression of your refined aesthetic.
            </ThemedText>
          </View>

          <View style={styles.philosophyRow}>
            <View style={[styles.philosophyCol, { backgroundColor: '#FFFFFF' }]}>
              <ThemedText style={styles.philosophyNum}>01</ThemedText>
              <ThemedText style={styles.philosophyTitle}>Sustainable Oak</ThemedText>
              <ThemedText style={styles.philosophyText}>
                We source our premium wood from responsibly managed forests, ensuring that every grain preserves the ecosystem.
              </ThemedText>
            </View>

            <View style={[styles.philosophyCol, { backgroundColor: '#FFFFFF' }]}>
              <ThemedText style={styles.philosophyNum}>02</ThemedText>
              <ThemedText style={styles.philosophyTitle}>Masterful Tailoring</ThemedText>
              <ThemedText style={styles.philosophyText}>
                Our textiles are hand-woven from custom cashmere and linen blends, providing unprecedented softness and durability.
              </ThemedText>
            </View>

            <View style={[styles.philosophyCol, { backgroundColor: '#FFFFFF' }]}>
              <ThemedText style={styles.philosophyNum}>03</ThemedText>
              <ThemedText style={styles.philosophyTitle}>Timeless Aesthetics</ThemedText>
              <ThemedText style={styles.philosophyText}>
                By bypassing fleeting trends, we create structural masterpieces designed to feel fresh and gorgeous for generations.
              </ThemedText>
            </View>
          </View>

          <View style={styles.quoteBlock}>
            <ThemedText style={styles.quoteText}>
              &quot;Simplicity is the ultimate sophistication. Lumora is the pursuit of that pure harmony.&quot;
            </ThemedText>
            <ThemedText style={styles.quoteAuthor}>— ALBERT VERO, HEAD ARTISAN</ThemedText>
          </View>
        </View>

        {/* Footer */}
        <FooterHero />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  webScrollContent: {
    alignItems: 'center',
  },
  heroSection: {
    width: '100%',
    height: 380,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 17, 0.45)',
  },
  heroTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroSubtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#E7E0D8',
    letterSpacing: 3,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 38,
    color: '#F6F1EB',
    textAlign: 'center',
    lineHeight: 46,
  },
  narrativeContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xl,
  },
  block: {
    alignItems: 'center',
    marginBottom: 48,
    textAlign: 'center',
  },
  blockLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#A06E50',
    letterSpacing: 2,
    marginBottom: 8,
  },
  blockHeading: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  blockText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 720,
  },
  philosophyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
    marginBottom: 50,
  },
  philosophyCol: {
    flex: 1,
    minWidth: 280,
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  philosophyNum: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#E7E0D8',
    marginBottom: 15,
  },
  philosophyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#111',
    marginBottom: 8,
  },
  philosophyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  quoteBlock: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E7E0D8',
    paddingVertical: 36,
    alignItems: 'center',
    marginBottom: 20,
  },
  quoteText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 20,
    fontStyle: 'italic',
    color: '#111',
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 600,
  },
  quoteAuthor: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#888',
    letterSpacing: 1.5,
  },
});
