import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Image, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedText } from './themed-text';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/wishlistHelper';
import { addToCart } from '@/lib/cartHelper';
import { supabase } from '@/lib/supabase';

const COLUMN_GAP = 20;
const MAX_GRID_WIDTH = 1200;

const CATEGORIES = ['All', 'Sofa', 'Chair', 'Table', 'Bed', 'Lamp'];

const PRODUCTS = [
  {
    id: '1',
    name: 'Verona Luxe Sofa',
    price: '₱144,420',
    rating: '4.9',
    image: require('@/assets/images/verona_sofa_clean.png'),
    category: 'Sofa',
  },
  {
    id: '2',
    name: 'Vero Modular',
    price: '₱72,500',
    rating: '4.1',
    image: require('@/assets/images/armchair_clean.png'),
    category: 'Chair',
  },
  {
    id: '3',
    name: 'Rustic Seat Bar Stool',
    price: '₱39,440',
    rating: '4.8',
    image: require('@/assets/images/rustic_chair_clean.png'),
    category: 'Chair',
  },
  {
    id: '4',
    name: 'Nova Line Lamp',
    price: '₱24,360',
    rating: '4.7',
    image: require('@/assets/images/nova_lamp_clean.png'),
    category: 'Lamp',
  },
  {
    id: '5',
    name: 'Aurelius Lounge',
    price: '₱109,620',
    rating: '4.9',
    image: require('@/assets/images/lounge_chair_clean.png'),
    category: 'Chair',
  },
  {
    id: '6',
    name: 'Nordic Dining Table',
    price: '₱185,600',
    rating: '4.9',
    image: require('@/assets/images/dining-table.png'),
    category: 'Table',
  },
];

function ProductCard({ product, itemWidth, colors, colorScheme, isFavorited, onToggleFavorite, onAddToCart }: any) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    };
  });

  const handleHoverIn = () => {
    setIsHovered(true);
    scale.value = withSpring(1.02);
    translateY.value = withSpring(-5);
  };

  const handleHoverOut = () => {
    setIsHovered(false);
    scale.value = withSpring(1);
    translateY.value = withSpring(0);
  };

  return (
    <View style={[styles.cardContainer, { width: itemWidth }]}>
      <Pressable
        onPressIn={handleHoverIn}
        onPressOut={handleHoverOut}
        {...({
          onMouseEnter: handleHoverIn,
          onMouseLeave: handleHoverOut,
        } as any)}
        style={{ flex: 1 }}
        onPress={() => router.push(`/product/${product.id}` as any)}
      >
        <Animated.View style={[styles.animatedCard, animatedStyle]}>
          <View style={[
            styles.card, 
            { 
              backgroundColor: '#F5F5F5',
              borderColor: isHovered ? '#C9A96E' : 'transparent',
              borderWidth: 2,
              shadowOpacity: isHovered ? 0.2 : 0.05,
              shadowRadius: isHovered ? 16 : 12,
            }
          ]}>
            {/* Image Section */}
            <View style={styles.imageSection}>
              <Image source={product.image} style={styles.image} resizeMode="contain" />
              <View style={styles.badgeContainer}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <ThemedText style={styles.ratingText}>{product.rating}</ThemedText>
                </View>
                <Pressable 
                  style={styles.favoriteButton} 
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(product.id);
                  }}
                >
                  <Ionicons 
                    name={isFavorited ? "heart" : "heart-outline"} 
                    size={16} 
                    color={isFavorited ? "#E74C3C" : "#000"} 
                  />
                </Pressable>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              <View style={styles.infoRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText numberOfLines={1} style={styles.productName}>
                    {product.name}
                  </ThemedText>
                  <ThemedText style={styles.priceText}>{product.price}</ThemedText>
                </View>
                <Pressable 
                  style={styles.addButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                >
                  <Ionicons name="bag-outline" size={16} color="#000" />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function OurProducts() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    const list = await getWishlist();
    setFavorites(list.map(item => item.id));
  };

  const toggleFavorite = async (id: string) => {
    const isFav = favorites.includes(id);
    if (isFav) {
      const updatedList = await removeFromWishlist(id);
      setFavorites(updatedList.map(item => item.id));
    } else {
      const product = PRODUCTS.find(p => p.id === id);
      if (product) {
        const updatedList = await addToWishlist({
          id: product.id,
          name: product.name,
          brand: product.category,
          price: product.price,
          image: product.image,
          category: product.category
        });
        setFavorites(updatedList.map(item => item.id));
      }
    }
  };

  const handleAddToCart = async (product: any) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push('/signin');
      return;
    }
    
    await addToCart({
      id: product.id,
      name: product.name,
      brand: product.brand || product.category,
      price: product.price,
      image: product.image,
      category: product.category
    });
    router.push('/(tabs)/cart');
  };

  const filteredProducts = activeCategory === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  const columnCount = Platform.OS === 'web' && width > 768 ? 3 : 2;
  const horizontalPadding = Platform.OS === 'web' ? Math.max(20, (width - MAX_GRID_WIDTH) / 2) : 20;
  const gridWidth = width - (horizontalPadding * 2);
  const itemWidth = (gridWidth - (COLUMN_GAP * (columnCount - 1))) / columnCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, Typography.sectionHeading, { color: colors.text }]}>
          OUR PRODUCTS
        </ThemedText>
        <ThemedText style={[styles.subtitle, Typography.bodyText, { color: colors.text, opacity: 0.7 }]}>
          Experience the perfect blend of luxury, quality, and design in every piece.
        </ThemedText>
      </View>

      <View style={styles.tabsContainer}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.text : 'rgba(255, 255, 255, 0.4)',
                  borderColor: isActive ? colors.text : colors.border,
                }
              ]}
            >
              <ThemedText style={[
                styles.tabText,
                { color: isActive ? colors.background : colors.text }
              ]}>
                {cat}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            itemWidth={itemWidth}
            colors={colors}
            colorScheme={colorScheme}
            isFavorited={favorites.includes(product.id)}
            onToggleFavorite={toggleFavorite}
            onAddToCart={handleAddToCart}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 30,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
    justifyContent: 'center',
  },
  cardContainer: {
    marginBottom: COLUMN_GAP,
    height: 320,
  },
  animatedCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  imageSection: {
    height: 200,
    padding: 15,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#000',
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  priceText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#666',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
