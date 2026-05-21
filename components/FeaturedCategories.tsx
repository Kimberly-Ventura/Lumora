import React from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 15;
const ITEM_WIDTH = (width - 40 - COLUMN_GAP) / 2;

interface Category {
  id: string;
  name: string;
  image: any;
  span?: number;
}

const CATEGORIES: Category[] = [
  { id: '1', name: 'SOFAS', image: require('@/assets/images/hero-sofa.png'), span: 2 },
  { id: '2', name: 'TABLES', image: require('@/assets/images/dining-table.png') },
  { id: '3', name: 'BEDS', image: require('@/assets/images/bed.png') },
  { id: '4', name: 'LIGHTING', image: require('@/assets/images/lighting.png') },
  { id: '5', name: 'DECOR', image: require('@/assets/images/decor.png') },
];

export function FeaturedCategories() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.sectionTitle, Typography.sectionHeading]}>Collections</ThemedText>
      
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <Pressable 
            key={cat.id} 
            style={[
              styles.item, 
              { width: cat.span === 2 ? width - 40 : ITEM_WIDTH }
            ]}
          >
            <View style={[styles.imageContainer, { backgroundColor: colors.cardBackground }]}>
              <Image source={cat.image} style={styles.image} resizeMode="cover" />
              <View style={styles.overlay}>
                <ThemedText style={styles.catName}>{cat.name}</ThemedText>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  item: {
    marginBottom: 10,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 3,
  },
});
