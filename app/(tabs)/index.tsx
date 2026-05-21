import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
   View, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Image, 
  Dimensions, 
  Platform,
  useWindowDimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { FeaturesSection } from '@/components/FeaturesSection';
import { FooterHero } from '@/components/FooterHero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/wishlistHelper';

const { width: windowWidth } = Dimensions.get('window');

const CATEGORIES = ['Chair', 'Table', 'Bed', 'Sofa', 'Desk'];

const PRODUCTS = [
  { id: '1', name: 'Verona Luxe Sofa', brand: 'Lumora Luxe', price: '₱144,420', image: require('@/assets/images/verona_sofa_clean.png'), category: 'Sofa', rating: 4.9 },
  { id: '2', name: 'Vero Modular Chair', brand: 'Easy Habits', price: '₱72,500', image: require('@/assets/images/armchair_clean.png'), category: 'Chair', rating: 4.8 },
  { id: '3', name: 'Rustic Bar Stool', brand: 'Reclaimed Oak', price: '₱39,440', image: require('@/assets/images/rustic_chair_clean.png'), category: 'Chair', rating: 4.7 },
  { id: '4', name: 'Nova Line Lamp', brand: 'Sculptural Brass', price: '₱24,360', image: require('@/assets/images/nova_lamp_clean.png'), category: 'Lamp', rating: 4.9 },
  { id: '5', name: 'Aurelius Lounge', brand: 'Cashmere Blend', price: '₱109,620', image: require('@/assets/images/lounge_chair_clean.png'), category: 'Chair', rating: 4.9 },
  { id: '6', name: 'Nordic Dining Table', brand: 'Solid Oak', price: '₱185,600', image: require('@/assets/images/dining-table.png'), category: 'Table', rating: 4.8 },
];

const TRENDING_PRODUCTS = [
  { id: '1', name: 'Verona Luxe Sofa', brand: 'Lumora Luxe', price: '₱144,420', image: require('@/assets/images/verona_sofa_clean.png'), rating: 4.9, badge: 'BEST SELLER', views: '2.4k views this week' },
  { id: '2', name: 'Vero Modular Chair', brand: 'Easy Habits', price: '₱72,500', image: require('@/assets/images/armchair_clean.png'), rating: 4.8, badge: 'TRENDING NOW', views: '1.8k views this week' },
  { id: '5', name: 'Aurelius Lounge', brand: 'Cashmere Blend', price: '₱109,620', image: require('@/assets/images/lounge_chair_clean.png'), rating: 4.9, badge: 'LIMITED EDITION', views: '980 views this week' },
];

const ROOM_SHOWCASE = [
  { id: '1', name: 'Japandi Living Gallery', desc: 'Serene minimalist balance', image: require('@/assets/images/verona_living_room.png') },
  { id: '2', name: 'Verona Lounge Sanctuary', desc: 'Tactile Belgian linen elegance', image: require('@/assets/images/verona_lounge.png') },
  { id: '3', name: 'Nordic Workspace Alcove', desc: 'Solid oak and brass precision', image: require('@/assets/images/nordic_workspace.png') },
  { id: '4', name: 'Sienna Dining Chamber', desc: 'Travertine and leather harmony', image: require('@/assets/images/sienna_dining.png') },
  { id: '5', name: 'Classic Wooden Study', desc: 'Warm walnut and luxury office design', image: require('@/assets/images/study_office.jpg') },
  { id: '6', name: 'Grand Staircase Lounge', desc: 'Geometric white high-ceiling lounge', image: require('@/assets/images/grand_staircase.jpg') },
  { id: '7', name: 'Minimalist Stone Kitchen', desc: 'Sleek dark marble dining gallery', image: require('@/assets/images/minimal_kitchen.jpg') },
];

export default function HomeScreen() {
  const { width: currentWidth } = useWindowDimensions();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [user, setUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('Chair');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const roomScrollRef = useRef<ScrollView>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  const isMobile = currentWidth < 768;
  const roomWidth = isMobile ? currentWidth - 32 : 800;
  const roomHeight = isMobile ? (currentWidth - 32) * 0.625 : 500;

  const roomWidthRef = useRef(roomWidth);
  useEffect(() => {
    roomWidthRef.current = roomWidth;
  }, [roomWidth]);

  useEffect(() => {
    const initialWidth = roomWidthRef.current;
    // Snap to the middle set of cards initially
    setTimeout(() => {
      roomScrollRef.current?.scrollTo({ x: ROOM_SHOWCASE.length * initialWidth, animated: false });
    }, 150);

    let currentIndex = ROOM_SHOWCASE.length;

    const timer = setInterval(() => {
      currentIndex += 1;
      const step = roomWidthRef.current;
      roomScrollRef.current?.scrollTo({ x: currentIndex * step, animated: true });
      setActiveRoomIndex(currentIndex % ROOM_SHOWCASE.length);

      // Snap back to middle set if we reach the end of the middle set to loop infinitely
      if (currentIndex >= ROOM_SHOWCASE.length * 2) {
        setTimeout(() => {
          currentIndex = ROOM_SHOWCASE.length;
          roomScrollRef.current?.scrollTo({ x: currentIndex * step, animated: false });
          setActiveRoomIndex(0);
        }, 600); // Allow animation to finish before snapping back
      }
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const step = roomWidthRef.current;
    const index = Math.round(contentOffsetX / step);
    setActiveRoomIndex(index % ROOM_SHOWCASE.length);

    // Infinite loop snapping for manual user swipe gestures
    const totalItems = ROOM_SHOWCASE.length;
    if (contentOffsetX <= (totalItems - 1) * step) {
      roomScrollRef.current?.scrollTo({ x: contentOffsetX + totalItems * step, animated: false });
    } else if (contentOffsetX >= (totalItems * 2) * step) {
      roomScrollRef.current?.scrollTo({ x: contentOffsetX - totalItems * step, animated: false });
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.warn('Could not fetch user session:', err);
      }
    };
    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    const list = await getWishlist();
    setFavorites(list.map(item => item.id));
  };

  const toggleFavorite = async (productId: string) => {
    const isFav = favorites.includes(productId);
    if (isFav) {
      const updatedList = await removeFromWishlist(productId);
      setFavorites(updatedList.map(item => item.id));
    } else {
      // Find item in PRODUCTS or TRENDING_PRODUCTS
      const product: any = PRODUCTS.find(p => p.id === productId) || 
                           TRENDING_PRODUCTS.find(p => p.id === productId);
      if (product) {
        const updatedList = await addToWishlist({
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: product.image,
          category: product.category
        });
        setFavorites(updatedList.map(item => item.id));
      }
    }
  };

  const username = user?.user_metadata?.username || 'Guest';

  // Filter products based on search query and category
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = product.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const isWeb = Platform.OS === 'web';
  const contentWidth = isWeb ? Math.min(currentWidth, 1200) : currentWidth;
  const headerHeight = isWeb ? 70 : 110;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Brand Top Header Bar */}
      <Header />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: headerHeight },
          isWeb && styles.webScrollContent
        ]}
      >
        {/* 2. Spacious Hero Spotlight Banner */}
        <View style={{ width: contentWidth, alignSelf: 'center', marginVertical: 15 }}>
          <Hero imageUri={require('@/assets/images/hero-sofa.png')} />
        </View>

        {/* Unified Browsing Container (Centered on Web) */}
        <View style={[styles.innerContent, { width: contentWidth }]}>

          {/* 4. Promotional Offer Banner */}
          <View style={[styles.promoCard, { backgroundColor: 'transparent' }, isMobile && { height: 'auto', flexDirection: 'column', alignItems: 'center', paddingVertical: 20 }]}>
            <View style={[styles.promoTextContainer, isMobile && { alignItems: 'center', marginBottom: 24, width: '100%' }]}>
              <ThemedText style={[styles.promoSubtitle, isMobile && { textAlign: 'center' }]}>The Special</ThemedText>
              <ThemedText style={[styles.promoTitle, isMobile && { fontSize: 28, lineHeight: 34, textAlign: 'center' }]}>Offer Up to</ThemedText>
              <ThemedText style={[styles.promoPercentage, isMobile && { fontSize: 48, lineHeight: 54, textAlign: 'center', marginBottom: 12 }]}>30% off</ThemedText>
              <Pressable 
                style={[styles.promoButton, isMobile && { alignSelf: 'center' }]}
                onPress={() => {
                  if (user) {
                    router.push('/(tabs)/shop');
                  } else {
                    router.push('/signin');
                  }
                }}
              >
                <ThemedText style={styles.promoButtonText}>Shop Now</ThemedText>
              </Pressable>
            </View>
            <View style={[styles.promoImageContainer, isMobile && { marginLeft: 0, marginTop: 10, width: '100%', height: 240 }]}>
              <Image 
                source={require('@/assets/images/promo_classic_armchair_transparent.png')} 
                style={[styles.promoImage, isMobile && { width: 240, height: 240 }]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Room Showcase Carousel */}
          <View style={[styles.roomShowcaseSection, { width: roomWidth }]}>
            <View style={[styles.roomScrollWrapper, { width: roomWidth, height: roomHeight }]}>
              <ScrollView
                ref={roomScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled={false}
                decelerationRate="fast"
                snapToInterval={roomWidth}
                snapToAlignment="start"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.roomScrollList}
              >
                {[...ROOM_SHOWCASE, ...ROOM_SHOWCASE, ...ROOM_SHOWCASE].map((room, idx) => (
                  <View key={`${room.id}-${idx}`} style={[styles.roomCard, { width: roomWidth, height: roomHeight }]}>
                    <Image source={room.image} style={styles.roomImage} resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Custom Dot Pagination Indicators */}
            <View style={styles.dotContainer}>
              {ROOM_SHOWCASE.map((_, idx) => {
                const isActive = activeRoomIndex === idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.paginationDot,
                      isActive && styles.paginationDotActive
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* 3. Discover Section & Search */}
          <View style={[styles.discoverSection, { marginTop: Spacing.l, marginBottom: Spacing.s }]}>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.discoverHeadingSmall}>Discover your</ThemedText>
              <ThemedText style={styles.discoverHeadingLarge}>Best Furniture</ThemedText>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: '#FFFFFF' }]}>
              <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search product"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* 5. Categories Capsule Selection */}
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
              <Pressable onPress={() => router.push('/(tabs)/explore')}>
                <ThemedText style={styles.seeAllText}>See All</ThemedText>
              </Pressable>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            >
              {CATEGORIES.map(cat => {
                const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[
                      styles.categoryPill,
                      isActive 
                        ? { backgroundColor: '#111111', borderColor: '#111111' } 
                        : { backgroundColor: '#FFFFFF', borderColor: '#E7E0D8' }
                    ]}
                  >
                    <ThemedText 
                      style={[
                        styles.categoryText, 
                        { color: isActive ? '#F6F1EB' : '#111111' }
                      ]}
                    >
                      {cat}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 6. Overhauled Responsive Product Grid */}
          <View style={styles.gridSection}>
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="#999" />
                <ThemedText style={styles.emptyText}>No items found in this category.</ThemedText>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredProducts.map(product => {
                  const isFav = favorites.includes(product.id);
                  return (
                    <Pressable
                      key={product.id}
                      style={[
                        styles.productCard, 
                        { 
                          backgroundColor: '#FFFFFF', 
                          width: isMobile ? '48%' : '31.5%',
                          marginBottom: 16,
                        }
                      ]}
                      onPress={() => router.push(`/product/${product.id}` as any)}
                    >
                      <View style={styles.productImageContainer}>
                        <Image source={product.image} style={styles.productImage} resizeMode="contain" />
                        <Pressable 
                          style={[styles.favBadge, { backgroundColor: 'rgba(255,255,255,0.85)' }]}
                          onPress={() => toggleFavorite(product.id)}
                        >
                          <Ionicons 
                            name={isFav ? "heart" : "heart-outline"} 
                            size={15} 
                            color={isFav ? "#E74C3C" : "#666"} 
                          />
                        </Pressable>
                      </View>
                      
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
                            <Ionicons name="arrow-forward" size={13} color="#FFF" />
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* New: Trending Masterpieces Section */}
          <View style={styles.trendingSection}>
            {/* Header titles */}
            <View style={styles.trendingHeaderBlock}>
              <ThemedText style={styles.trendingSubtitle}>MOST COVETED DESIGNS</ThemedText>
              <ThemedText style={styles.trendingTitle}>Trending Masterpieces</ThemedText>
              <ThemedText style={styles.trendingDescription}>
                Explore our highly sought-after architectural collections, handpicked by top designers for their peerless build quality and visual elegance.
              </ThemedText>
            </View>

            {/* Large showcase banner for number 1 trending */}
            <Pressable 
              style={[
                styles.featuredBanner, 
                { 
                  backgroundColor: '#E7E0D8',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 24 : 20,
                }
              ]}
              onPress={() => router.push('/product/1')}
            >
              <View style={[styles.bannerDetails, isMobile && { flex: undefined, minWidth: '100%' }]}>
                <View style={styles.badgeContainer}>
                  <ThemedText style={styles.badgeText}>NUMBER 1 BESTSELLER</ThemedText>
                </View>
                <ThemedText style={styles.bannerTitle}>Verona Luxe Sofa</ThemedText>
                <ThemedText style={styles.bannerDesc}>
                  A luxurious embodiment of mid-century aesthetics meeting modern linen relaxation.
                </ThemedText>
                <ThemedText style={styles.bannerPrice}>$2,490</ThemedText>
                <View style={styles.exploreButton}>
                  <ThemedText style={styles.exploreButtonText}>View Collection Detail</ThemedText>
                  <Ionicons name="arrow-forward" size={13} color="#FFF" />
                </View>
              </View>
              <View style={[styles.bannerImageContainer, isMobile && { flex: undefined, minWidth: '100%', height: 180, marginTop: 10 }]}>
                <Image 
                  source={require('@/assets/images/verona_sofa_clean.png')} 
                  style={[styles.bannerImage, isMobile && { width: 240, alignSelf: 'center' }]}
                  resizeMode="contain"
                />
              </View>
            </Pressable>

            {/* Grid of other trending items */}
            <View style={styles.gridSection}>
              <ThemedText style={styles.sectionTitle}>Weekly Hot Picks</ThemedText>
              <View style={styles.grid}>
                {TRENDING_PRODUCTS.map(product => {
                  const isFav = favorites.includes(product.id);
                  return (
                    <Pressable
                      key={product.id}
                      style={[
                        styles.productCard, 
                        { 
                          backgroundColor: '#FFFFFF', 
                          width: isMobile ? '48%' : '31.5%',
                          marginBottom: 16,
                        }
                      ]}
                      onPress={() => router.push(`/product/${product.id}` as any)}
                    >
                      <View style={styles.productImageContainer}>
                        <Image source={product.image} style={styles.productImage} resizeMode="contain" />
                        <View style={styles.cardBadge}>
                          <ThemedText style={styles.cardBadgeText}>{product.badge}</ThemedText>
                        </View>
                        <Pressable 
                          style={[styles.favBadge, { backgroundColor: 'rgba(255,255,255,0.85)' }]}
                          onPress={() => toggleFavorite(product.id)}
                        >
                          <Ionicons 
                            name={isFav ? "heart" : "heart-outline"} 
                            size={15} 
                            color={isFav ? "#E74C3C" : "#666"} 
                          />
                        </Pressable>
                      </View>
                      
                      <View style={styles.productDetails}>
                        <ThemedText style={styles.viewsCount}>{product.views}</ThemedText>
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
                            <Ionicons name="arrow-forward" size={13} color="#FFF" />
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

        </View>

        {/* 7. Brand Value Propositions Section */}
        <FeaturesSection />

        {/* 8. Bottom Full-width Footer Hero */}
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
  welcomeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginBottom: Spacing.s,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  welcomeSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    opacity: 0.5,
  },
  welcomeTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E74C3C',
  },
  innerContent: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.xl,
  },
  discoverSection: {
    marginBottom: Spacing.l,
  },
  titleContainer: {
    marginBottom: Spacing.m,
  },
  discoverHeadingSmall: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 22,
    color: '#655E56',
    letterSpacing: 0.5,
  },
  discoverHeadingLarge: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    color: '#111111',
    lineHeight: 40,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCD8D3',
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FAF9F6',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111',
  },
  promoCard: {
    height: 340,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginBottom: Spacing.xl,
    overflow: 'visible',
    position: 'relative',
    backgroundColor: 'transparent',
    maxWidth: 750,
    width: '100%',
    alignSelf: 'center',
  },
  promoTextContainer: {
    flex: 1.2,
    justifyContent: 'center',
  },
  promoSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#A06E50',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  promoTitle: {
    fontSize: 34,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111111',
    lineHeight: 40,
  },
  promoPercentage: {
    fontSize: 64,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111111',
    lineHeight: 70,
    marginBottom: 16,
  },
  promoButton: {
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#F6F1EB',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  promoImageContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    marginLeft: -70,
  },
  promoImage: {
    width: 550,
    height: 550,
  },
  categoriesSection: {
    marginBottom: Spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#111111',
    textDecorationLine: 'underline',
  },
  categoriesList: {
    gap: 10,
    paddingRight: 20,
  },
  categoryPill: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  gridSection: {
    flex: 1,
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: Platform.OS === 'web' && windowWidth > 768 ? '31.5%' : '47.5%',
    borderRadius: 24,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageContainer: {
    height: 185,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 12,
    textAlign: 'center',
  },
  trendingSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  trendingHeaderBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  trendingSubtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#A06E50',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  trendingTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  trendingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 640,
    alignSelf: 'center',
  },
  featuredBanner: {
    borderRadius: 20,
    minHeight: 240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 30,
    marginBottom: 48,
    overflow: 'hidden',
    position: 'relative',
    gap: 20,
    backgroundColor: '#EAE2D5',
  },
  bannerDetails: {
    flex: 1.2,
    minWidth: 260,
    justifyContent: 'center',
  },
  badgeContainer: {
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 0,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#F6F1EB',
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
    color: '#111111',
    marginBottom: 8,
  },
  bannerDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  bannerPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#111111',
    marginBottom: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 0,
    alignSelf: 'flex-start',
    gap: 8,
  },
  exploreButtonText: {
    color: '#F6F1EB',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  bannerImageContainer: {
    flex: 1,
    minWidth: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 180,
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#A06E50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  cardBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontFamily: 'Inter-SemiBold',
  },
  viewsCount: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#A06E50',
    marginBottom: 4,
  },
  roomShowcaseSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    width: 800,
    alignSelf: 'center',
  },
  roomScrollWrapper: {
    width: 800,
    height: 500,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
  },
  roomScrollList: {
    paddingVertical: 0,
    gap: 0,
  },
  roomCard: {
    width: 800,
    height: 500,
    backgroundColor: '#FAFAFA',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 15,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DDD',
  },
  paginationDotActive: {
    backgroundColor: '#A06E50',
    width: 14,
  },
});
