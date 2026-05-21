import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Image, Pressable, Dimensions, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { FooterHero } from '@/components/FooterHero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { getWishlist, removeFromWishlist, WishlistItem } from '@/lib/wishlistHelper';

const { width: windowWidth } = Dimensions.get('window');

export default function WishlistScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [items, setItems] = useState<WishlistItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [])
  );

  const loadWishlist = async () => {
    const list = await getWishlist();
    setItems(list);
  };

  const removeItem = async (id: string) => {
    const updated = await removeFromWishlist(id);
    setItems(updated);
  };

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
        <View style={[styles.innerContent, { width: contentWidth }]}>
          {/* Header titles */}
          <View style={styles.headerBlock}>
            <ThemedText style={styles.subtitle}>YOUR PERSONAL SAVES</ThemedText>
            <ThemedText style={styles.title}>My Wishlist</ThemedText>
            <ThemedText style={styles.description}>
              Keep track of the designs that inspire you. Review, add to bag, or share your curation.
            </ThemedText>
          </View>

          {/* List items */}
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-dislike-outline" size={32} color="#A06E50" />
              </View>
              <ThemedText style={styles.emptyHeading}>Your Wishlist is Empty</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Browse our premium collection to save your absolute favorites.
              </ThemedText>
              <Pressable 
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)')}
              >
                <ThemedText style={styles.exploreBtnText}>Explore Collection</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.gridSection}>
              <View style={styles.grid}>
                {items.map(product => {
                  return (
                    <View
                      key={product.id}
                      style={[styles.productCard, { backgroundColor: '#FFFFFF' }]}
                    >
                      <Pressable 
                        style={styles.productImageContainer}
                        onPress={() => router.push(`/product/${product.id}` as any)}
                      >
                        <Image source={product.image} style={styles.productImage} resizeMode="contain" />
                        <Pressable 
                          style={[styles.favBadge, { backgroundColor: 'rgba(255,255,255,0.85)' }]}
                          onPress={() => removeItem(product.id)}
                        >
                          <Ionicons name="trash-outline" size={15} color="#E74C3C" />
                        </Pressable>
                      </Pressable>
                      
                      <View style={styles.productDetails}>
                        <ThemedText style={styles.productName} numberOfLines={1}>
                          {product.name}
                        </ThemedText>
                        <ThemedText style={styles.productBrand}>
                          {product.brand}
                        </ThemedText>
                        
                        <View style={styles.productFooter}>
                          <ThemedText style={styles.productPrice}>
                            {product.price}
                          </ThemedText>
                          <Pressable 
                            style={styles.addCartBtn}
                            onPress={() => router.push(`/product/${product.id}` as any)}
                          >
                            <ThemedText style={styles.addCartText}>View Details</ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
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
  innerContent: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.xl,
    minHeight: 480,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#A06E50',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 640,
  },
  gridSection: {
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'flex-start',
  },
  productCard: {
    width: Platform.OS === 'web' && windowWidth > 768 ? '31.5%' : '47.5%',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageContainer: {
    height: 140,
    backgroundColor: '#F9F8F6',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  favBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productDetails: {
    marginTop: 10,
  },
  productName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#111',
  },
  productBrand: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  addCartBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#111111',
  },
  addCartText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F6F1EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E7E0D8',
  },
  emptyHeading: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    color: '#111',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  exploreBtn: {
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#F6F1EB',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
});
