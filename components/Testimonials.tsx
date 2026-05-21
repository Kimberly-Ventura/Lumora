import React from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

const REVIEWS = [
  {
    id: '1',
    author: 'Elena Ross',
    text: '"The Aurelius lounge chair is a masterpiece of design. It transformed my living room into a sanctuary of elegance."',
  },
  {
    id: '2',
    author: 'James Sterling',
    text: '"Exceptional quality and timeless aesthetics. LUMORA truly understands modern luxury furniture."',
  },
];

export function Testimonials() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.sectionTitle, Typography.sectionHeading]}>Client Reviews</ThemedText>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 20}
        decelerationRate="fast"
      >
        {REVIEWS.map((review) => (
          <View key={review.id} style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <ThemedText style={[styles.text, Typography.bodyText]}>{review.text}</ThemedText>
            <View style={[styles.line, { backgroundColor: colors.tint }]} />
            <ThemedText style={styles.author}>{review.author.toUpperCase()}</ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    backgroundColor: '#FAF9F7',
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: 40,
  },
  scrollContent: {
    paddingHorizontal: 40,
    gap: 20,
  },
  card: {
    width: CARD_WIDTH,
    padding: 40,
    alignItems: 'center',
    borderRadius: 2,
  },
  text: {
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
    marginBottom: 30,
  },
  line: {
    height: 1,
    width: 40,
    marginBottom: 20,
  },
  author: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 2,
  },
});
