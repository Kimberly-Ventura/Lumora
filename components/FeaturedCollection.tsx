import React from 'react';
import { StyleSheet, View, ScrollView, Image, Dimensions, Pressable } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

interface Product {
  id: string;
  name: string;
  price: string;
  image: any;
}

interface FeaturedCollectionProps {
  products: Product[];
}

export function FeaturedCollection({ products }: FeaturedCollectionProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>New Arrivals</ThemedText>
        <Pressable>
          <ThemedText style={[styles.viewAll, { color: colors.tint }]}>VIEW ALL</ThemedText>
        </Pressable>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 20}
        decelerationRate="fast"
      >
        {products.map((product) => (
          <View key={product.id} style={styles.card}>
            <View style={[styles.imageContainer, { backgroundColor: colors.cardBackground }]}>
              <Image source={product.image} style={styles.image} resizeMode="contain" />
            </View>
            <View style={styles.info}>
              <ThemedText style={styles.productName}>{product.name}</ThemedText>
              <ThemedText style={[styles.price, { color: colors.icon }]}>{product.price}</ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
  },
  viewAll: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    width: CARD_WIDTH,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  image: {
    width: '90%',
    height: '90%',
  },
  info: {
    marginTop: 15,
  },
  productName: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 18,
    marginBottom: 5,
  },
  price: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    letterSpacing: 1,
  },
});
