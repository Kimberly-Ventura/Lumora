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
  useWindowDimensions,
  Modal
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
import { Skeleton } from '@/components/Skeleton';

const SHOWCASE_SWATCHES = [
  { name: 'Original Linen', hex: '#ORIGINAL', displayColor: '#E2DDD9' },
  { name: 'Classic Terracotta', hex: '#D09252' },
  { name: 'Serene Blue', hex: '#829FAD' },
  { name: 'Warm Charcoal', hex: '#4A4A4A' },
  { name: 'Champagne Linen', hex: '#E7E0D8' },
];

const { width: windowWidth } = Dimensions.get('window');

const ROOM_CATEGORIES = [
  { name: 'Office', image: require('@/assets/images/office-room.jpg') },
  { name: 'Living room', image: require('@/assets/images/living-room.png') },
  { name: 'Dining room', image: require('@/assets/images/dining-room.png') },
  { name: 'Bedroom', image: require('@/assets/images/bed-room.png') },
];

const SHOP_CATEGORIES = [
  { name: 'New arrival', text: 'NEW' },
  { name: 'Chair', icon: require('@/assets/images/chair-category.png') },
  { name: 'Table', icon: require('@/assets/images/dining-set-category.png') },
  { name: 'Lamp', icon: require('@/assets/images/lamp-category.png') },
  { name: 'Sofa', icon: require('@/assets/images/sofa-category.png') },
  { name: 'Bed', icon: require('@/assets/images/bed-category.png') },
];

const PRODUCTS = [
  { id: '1', name: 'Verona Luxe Sofa', brand: 'Lumora Luxe', price: '₱144,420', originalPrice: '₱160,000', discount: '10% OFF', image: require('@/assets/images/verona_sofa_clean.png'), category: 'Sofa', rating: 4.9, tag: 'Bestseller' },
  { id: '2', name: 'Vero Modular Chair', brand: 'Easy Habits', price: '₱72,500', originalPrice: '₱90,000', discount: '20% OFF', image: require('@/assets/images/armchair_clean.png'), category: 'Chair', rating: 4.8, tag: 'New Arrivals' },
  { id: '3', name: 'Rustic Bar Stool', brand: 'Reclaimed Oak', price: '₱39,440', originalPrice: '₱45,000', discount: '12% OFF', image: require('@/assets/images/rustic_chair_clean.png'), category: 'Chair', rating: 4.7, tag: 'Sale' },
  { id: '4', name: 'Nova Line Lamp', brand: 'Sculptural Brass', price: '₱24,360', originalPrice: '₱30,000', discount: '18% OFF', image: require('@/assets/images/nova_lamp_clean.png'), category: 'Lamp', rating: 4.9, tag: 'New Arrivals' },
  { id: '5', name: 'Aurelius Lounge', brand: 'Cashmere Blend', price: '₱109,620', originalPrice: '₱130,000', discount: '15% OFF', image: require('@/assets/images/lounge_chair_clean.png'), category: 'Chair', rating: 4.9, tag: 'Bestseller' },
  { id: '6', name: 'Nordic Dining Table', brand: 'Solid Oak', price: '₱185,600', originalPrice: '₱200,000', discount: '7% OFF', image: require('@/assets/images/dining-table.png'), category: 'Table', rating: 4.8, tag: 'Sale' },
];

const TRENDING_PRODUCTS = [
  { id: '1', name: 'Verona Luxe Sofa', brand: 'Lumora Luxe', price: '₱144,420', image: require('@/assets/images/verona_sofa_clean.png'), rating: 4.9, badge: 'BEST SELLER', views: '2.4k views this week' },
  { id: '2', name: 'Vero Modular Chair', brand: 'Easy Habits', price: '₱72,500', image: require('@/assets/images/armchair_clean.png'), rating: 4.8, badge: 'TRENDING NOW', views: '1.8k views this week' },
  { id: '5', name: 'Aurelius Lounge', brand: 'Cashmere Blend', price: '₱109,620', image: require('@/assets/images/lounge_chair_clean.png'), rating: 4.9, badge: 'LIMITED EDITION', views: '980 views this week' },
];

const ROOM_SHOWCASE = [
  { id: '1', name: 'Japandi Living Gallery', desc: 'Serene minimalist balance', image: require('@/assets/images/living-room.png') },
  { id: '2', name: 'Verona Lounge Sanctuary', desc: 'Tactile Belgian linen elegance', image: require('@/assets/images/verona_lounge.png') },
  { id: '3', name: 'Nordic Workspace Alcove', desc: 'Solid oak and brass precision', image: require('@/assets/images/office-room.jpg') },
  { id: '4', name: 'Sienna Dining Chamber', desc: 'Travertine and leather harmony', image: require('@/assets/images/dining-room.png') },
  { id: '5', name: 'Classic Wooden Study', desc: 'Warm walnut and luxury office design', image: require('@/assets/images/office-room.jpg') },
  { id: '6', name: 'Grand Staircase Lounge', desc: 'Geometric white high-ceiling lounge', image: require('@/assets/images/grand_staircase.jpg') },
  { id: '7', name: 'Minimalist Stone Kitchen', desc: 'Sleek dark marble dining gallery', image: require('@/assets/images/minimal_kitchen.jpg') },
];

export default function HomeScreen() {
  const { width: currentWidth } = useWindowDimensions();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [user, setUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeRoom, setActiveRoom] = useState('Office');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const roomScrollRef = useRef<ScrollView>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [shopCategories, setShopCategories] = useState<any[]>(SHOP_CATEGORIES);
  const [homeProducts, setHomeProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('name');
      if (data && !error) {
        const names = data.map((c: any) => c.name);
        const uniqueNames = Array.from(new Set(names)) as string[];
        
        const staticMap: Record<string, any> = {
          'chair': require('@/assets/images/chair-category.png'),
          'table': require('@/assets/images/dining-set-category.png'),
          'lamp': require('@/assets/images/lamp-category.png'),
          'sofa': require('@/assets/images/sofa-category.png'),
          'bed': require('@/assets/images/bed-category.png'),
        };

        const mapped = [
          { name: 'New arrival', text: 'NEW' },
          ...uniqueNames.map(name => {
            const key = name.toLowerCase();
            if (staticMap[key]) {
              return { name, icon: staticMap[key] };
            } else {
              const abbreviation = name.substring(0, 2).toUpperCase();
              return { name, text: abbreviation };
            }
          })
        ];
        setShopCategories(mapped);
      }
    } catch (err) {
      console.error('Error fetching categories in home:', err);
    }
  };

  const fetchHomeProducts = async (silent = false) => {
    if (!silent && homeProducts.length === 0) setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const mapped = data.map((item: any) => {
          const isOnSale = item.on_sale && item.discount_percentage && item.discount_percentage > 0;
          return {
            id: item.id,
            name: item.name,
            brand: item.categories?.name || 'Lumora Design',
            price: `₱${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            image: item.image_url ? { uri: item.image_url } : require('@/assets/images/armchair_clean.png'),
            category: item.categories?.name || '',
            tag: item.is_best_seller ? 'Best Seller' : (isOnSale ? `${item.discount_percentage}% OFF` : ''),
            discount: isOnSale ? `${item.discount_percentage}% OFF` : null,
            originalPrice: isOnSale ? `₱${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
            onSale: isOnSale,
            salePrice: isOnSale ? `₱${(parseFloat(item.price) * (1 - item.discount_percentage / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
            isBestSeller: item.is_best_seller,
            rooms: [] as string[],
          };
        });
        setHomeProducts(mapped);
      }
    } catch (err) {
      console.error('Error fetching products in home:', err);
    } finally {
      if (!silent || homeProducts.length === 0) {
        setIsLoadingProducts(false);
      }
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchHomeProducts();
    const catChannel = supabase
      .channel(`home-categories-changes-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();
      
    const prodChannel = supabase
      .channel(`home-products-changes-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchHomeProducts(true);
      })
      .subscribe();
      
    // 5-second polling fallback to ensure data updates silently even if Realtime drops or is disabled
    const interval = setInterval(() => {
      fetchHomeProducts(true);
      fetchCategories();
    }, 5000);
      
    return () => {
      supabase.removeChannel(catChannel);
      supabase.removeChannel(prodChannel);
      clearInterval(interval);
    };
  }, []);

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
      // Find item in homeProducts
      const product = homeProducts.find(p => p.id === productId);
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
    const matchesCategory = activeCategory === 'All' ? true : product.category.toLowerCase() === activeCategory.toLowerCase();
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
        {/* Search Bar Above Banner */}
        <View style={styles.homeSearchWrapper}>
          <View style={styles.homeSearchContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.homeSearchIcon} />
            <TextInput
              style={styles.homeSearchInput}
              placeholder="Search products..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  router.push(`/product-list?search=${encodeURIComponent(searchQuery)}` as any);
                }
              }}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* 2. Spacious Hero Spotlight Banner */}
        <View style={[styles.heroBannerNew, { width: windowWidth, alignSelf: 'center' }]}>
          <Image source={require('@/assets/images/hero-banner.jpg')} style={styles.heroBannerImageNew} resizeMode="cover" />
          <View style={styles.heroBannerOverlayNew}>
            <ThemedText style={styles.heroBannerTopTextNew}>THE BIGGEST SALE OF THE YEAR</ThemedText>
            <ThemedText style={styles.heroBannerMainTextNew}>FullHouse Fiesta</ThemedText>
            <ThemedText style={styles.heroBannerDiscountNew}>70% off</ThemedText>
            <Pressable style={styles.heroBannerBtnNew}>
              <ThemedText style={styles.heroBannerBtnTextNew}>SHOP NOW</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Unified Browsing Container (Centered on Web) */}
        <View style={[styles.innerContent, { width: contentWidth }]}>

          {/* 4. Promotional Offer Banner (Coupons) */}
          <View style={styles.offersSectionNew}>
            <ThemedText style={styles.sectionTitle}>Additional Discounts and Offers</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersListNew}>
              <View style={styles.offerCardNew}>
                <View style={styles.offerIconNew}>
                  <ThemedText style={styles.offerIconTextNew}>%</ThemedText>
                </View>
                <ThemedText style={styles.offerTextNew}>Extra ₱1,500 Off on Orders Above ₱20,000. Use Code EXTRA1500</ThemedText>
              </View>
              <View style={styles.offerCardNew}>
                <View style={styles.offerIconNew}>
                  <ThemedText style={styles.offerIconTextNew}>%</ThemedText>
                </View>
                <ThemedText style={styles.offerTextNew}>Extra ₱3,000 Off on Orders Above ₱30,000. Use Code EXTRA3000</ThemedText>
              </View>
            </ScrollView>
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
                directionalLockEnabled={true}
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

          {/* Shop by Categories (Circles) */}
          <View style={styles.shopByCategoriesSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Shop by Categories</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16} directionalLockEnabled={true} contentContainerStyle={styles.shopByCategoriesList}>
              {isLoadingProducts ? (
                [1, 2, 3, 4, 5].map(key => (
                  <View key={key} style={styles.shopCategoryItem}>
                    <Skeleton width={64} height={64} borderRadius={32} style={{ marginBottom: 12 }} />
                    <Skeleton width={48} height={12} />
                  </View>
                ))
              ) : (
                shopCategories.map((cat, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.shopCategoryItem}
                    onPress={() => router.push(`/product-list?category=${encodeURIComponent(cat.name)}` as any)}
                  >
                    <View style={styles.shopCategoryCircle}>
                      {cat.text ? (
                        <ThemedText style={styles.shopCategoryCircleText}>{cat.text}</ThemedText>
                      ) : (
                        <Image source={cat.icon} style={styles.shopCategoryIcon} resizeMode="contain" />
                      )}
                    </View>
                    <ThemedText style={styles.shopCategoryText}>{cat.name}</ThemedText>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>

          {/* Browse by Room (Cards) */}
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Browse by room</ThemedText>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              directionalLockEnabled={true}
              contentContainerStyle={styles.categoriesList}
            >
              {isLoadingProducts ? (
                [1, 2, 3].map(key => (
                  <View key={key} style={{ marginRight: 16 }}>
                    <Skeleton width={140} height={180} borderRadius={16} />
                  </View>
                ))
              ) : ROOM_CATEGORIES.map(cat => {
                return (
                  <Pressable
                    key={cat.name}
                    onPress={() => router.push(`/product-list?room=${encodeURIComponent(cat.name)}` as any)}
                    style={({ pressed }) => [
                      styles.roomSquareCard,
                      { transform: [{ scale: pressed ? 0.96 : 1 }] }
                    ]}
                  >
                    <Image source={cat.image} style={styles.roomSquareImage} resizeMode="cover" />
                    <ThemedText style={styles.roomSquareText}>{cat.name}</ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Flash Sales Section */}
          <View style={[styles.categoriesSection, { marginTop: 32 }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Flash Sales</ThemedText>
              <Pressable onPress={() => router.push('/product-list?filter=flash')}>
                <ThemedText style={styles.seeAllText}>View all</ThemedText>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16} directionalLockEnabled={true} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {isLoadingProducts ? (
                [1, 2, 3].map(key => (
                  <View key={`sale-skeleton-${key}`} style={{ width: 180, marginRight: 16, borderRadius: 12, overflow: 'hidden' }}>
                    <Skeleton width="100%" height={180} />
                    <View style={{ padding: 12, backgroundColor: colors.background }}>
                      <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                      <Skeleton width="100%" height={16} style={{ marginBottom: 12 }} />
                      <Skeleton width={80} height={16} />
                    </View>
                  </View>
                ))
              ) : homeProducts.filter(p => p.onSale).map(product => {
                const isFav = favorites.includes(product.id);
                return (
                  <Pressable
                    key={`sale-${product.id}`}
                    style={[
                      styles.productCard,
                      { width: 180, marginRight: 16, padding: 0, backgroundColor: '#FFFFFF', overflow: 'hidden' }
                    ]}
                    onPress={() => router.push(`/product/${product.id}` as any)}
                  >
                    <View style={styles.productImageContainer}>
                      <Image source={product.image} style={styles.productImage} resizeMode="cover" />
                      <View style={[styles.productTagNew, { backgroundColor: '#D9534F' }]}>
                        <ThemedText style={styles.productTagTextNew}>{product.discount || 'SALE'}</ThemedText>
                      </View>
                      <Pressable style={styles.favBadge} onPress={() => toggleFavorite(product.id)}>
                        <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? "#E74C3C" : "#333"} />
                      </Pressable>
                    </View>
                    <View style={styles.productDetails}>
                      <ThemedText style={styles.productBrand}>{product.brand}</ThemedText>
                      <ThemedText style={styles.productName} numberOfLines={1}>{product.name}</ThemedText>
                      <View style={[styles.productFooter, { justifyContent: 'flex-start', flexWrap: 'wrap', gap: 4 }]}>
                        <ThemedText style={[styles.productPrice, { color: '#E74C3C' }]}>{product.salePrice}</ThemedText>
                        <ThemedText style={styles.productOriginalPrice}>{product.originalPrice}</ThemedText>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Best Sellers Promo Banner */}
          <View style={styles.promoSetSaleBanner}>
            <View style={styles.promoSetSaleTextContainer}>
              <ThemedText style={styles.promoSetSaleTitle}>Bestsellers starting</ThemedText>
              <ThemedText style={styles.promoSetSaleSubtitle}>from <ThemedText style={styles.promoSetSalePrice}>₱2,999</ThemedText></ThemedText>
              <Pressable style={styles.promoSetSaleArrow}>
                <Ionicons name="arrow-forward" size={16} color="#111" />
              </Pressable>
            </View>
            <View style={{ width: '100%', position: 'relative', alignItems: 'center' }}>
              <Image source={require('@/assets/images/set-sale.png')} style={styles.promoSetSaleImage} resizeMode="contain" />
              <View style={styles.promoCircleBadge}>
                <ThemedText style={styles.promoCircleUpTo}>UP TO</ThemedText>
                <View style={styles.promoCircleMainRow}>
                  <ThemedText style={styles.promoCircleNumber}>65</ThemedText>
                  <View style={styles.promoCirclePercentContainer}>
                    <ThemedText style={styles.promoCirclePercent}>%</ThemedText>
                    <ThemedText style={styles.promoCircleOff}>OFF</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Best Sellers Section */}
          <View style={[styles.categoriesSection, { marginTop: 10 }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Best Sellers</ThemedText>
              <Pressable onPress={() => router.push('/product-list?filter=bestseller')}>
                <ThemedText style={styles.seeAllText}>View all</ThemedText>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16} directionalLockEnabled={true} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {isLoadingProducts ? (
                [1, 2, 3].map(key => (
                  <View key={`bestseller-skeleton-${key}`} style={{ width: 180, marginRight: 16, borderRadius: 12, overflow: 'hidden' }}>
                    <Skeleton width="100%" height={180} />
                    <View style={{ padding: 12, backgroundColor: colors.background }}>
                      <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                      <Skeleton width="100%" height={16} style={{ marginBottom: 12 }} />
                      <Skeleton width={80} height={16} />
                    </View>
                  </View>
                ))
              ) : homeProducts.filter(p => p.isBestSeller).map(product => {
                const isFav = favorites.includes(product.id);
                return (
                  <Pressable
                    key={`bestseller-${product.id}`}
                    style={[
                      styles.productCard,
                      { width: 180, marginRight: 16, padding: 0, backgroundColor: '#FFFFFF', overflow: 'hidden' }
                    ]}
                    onPress={() => router.push(`/product/${product.id}` as any)}
                  >
                    <View style={styles.productImageContainer}>
                      <Image source={product.image} style={styles.productImage} resizeMode="cover" />
                      <View style={[styles.productTagNew, { backgroundColor: '#F17E4F' }]}>
                        <ThemedText style={styles.productTagTextNew}>BEST SELLER</ThemedText>
                      </View>
                      <Pressable style={styles.favBadge} onPress={() => toggleFavorite(product.id)}>
                        <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? "#E74C3C" : "#333"} />
                      </Pressable>
                    </View>
                    <View style={styles.productDetails}>
                      <ThemedText style={styles.productBrand}>{product.brand}</ThemedText>
                      <ThemedText style={styles.productName} numberOfLines={1}>{product.name}</ThemedText>
                      <View style={[styles.productFooter, { justifyContent: 'flex-start', flexWrap: 'wrap', gap: 4 }]}>
                        {product.onSale ? (
                          <>
                            <ThemedText style={[styles.productPrice, { color: '#E74C3C' }]}>{product.salePrice}</ThemedText>
                            <ThemedText style={styles.productOriginalPrice}>{product.originalPrice}</ThemedText>
                          </>
                        ) : (
                          <ThemedText style={[styles.productPrice, { color: '#111111' }]}>{product.price}</ThemedText>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* New Arrivals Section */}
          <View style={[styles.categoriesSection, { marginTop: 10 }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>New Arrivals</ThemedText>
              <Pressable onPress={() => router.push('/product-list?filter=new')}>
                <ThemedText style={styles.seeAllText}>View all</ThemedText>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16} directionalLockEnabled={true} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {isLoadingProducts ? (
                [1, 2, 3].map(key => (
                  <View key={`new-skeleton-${key}`} style={{ width: 180, marginRight: 16, borderRadius: 12, overflow: 'hidden' }}>
                    <Skeleton width="100%" height={180} />
                    <View style={{ padding: 12, backgroundColor: colors.background }}>
                      <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                      <Skeleton width="100%" height={16} style={{ marginBottom: 12 }} />
                      <Skeleton width={80} height={16} />
                    </View>
                  </View>
                ))
              ) : homeProducts.slice(0, 8).map(product => {
                const isFav = favorites.includes(product.id);
                return (
                  <Pressable
                    key={`new-${product.id}`}
                    style={[
                      styles.productCard,
                      { width: 180, marginRight: 16, padding: 0, backgroundColor: '#FFFFFF', overflow: 'hidden' }
                    ]}
                    onPress={() => router.push(`/product/${product.id}` as any)}
                  >
                    <View style={styles.productImageContainer}>
                      <Image source={product.image} style={styles.productImage} resizeMode="cover" />
                      <View style={[styles.productTagNew, { backgroundColor: '#5A8D73' }]}>
                        <ThemedText style={styles.productTagTextNew}>NEW ARRIVAL</ThemedText>
                      </View>
                      <Pressable style={styles.favBadge} onPress={() => toggleFavorite(product.id)}>
                        <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? "#E74C3C" : "#333"} />
                      </Pressable>
                    </View>
                    <View style={styles.productDetails}>
                      <ThemedText style={styles.productBrand}>{product.brand}</ThemedText>
                      <ThemedText style={styles.productName} numberOfLines={1}>{product.name}</ThemedText>
                      <View style={[styles.productFooter, { justifyContent: 'flex-start', flexWrap: 'wrap', gap: 4 }]}>
                        {product.onSale ? (
                          <>
                            <ThemedText style={[styles.productPrice, { color: '#E74C3C' }]}>{product.salePrice}</ThemedText>
                            <ThemedText style={styles.productOriginalPrice}>{product.originalPrice}</ThemedText>
                          </>
                        ) : (
                          <ThemedText style={[styles.productPrice, { color: '#111111' }]}>{product.price}</ThemedText>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>



        </View>
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
  homeSearchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    zIndex: 10,
  },
  homeSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCD8D3',
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#FFF',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  homeSearchIcon: {
    marginRight: 10,
  },
  homeSearchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#111',
  },
  welcomeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    paddingHorizontal: 8,
    paddingTop: 16,
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
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
  roomSquareCard: {
    alignItems: 'center',
  },
  roomSquareImage: {
    width: 180,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  roomSquareText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gridSection: {
    flex: 1,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: Platform.OS === 'web' && windowWidth > 768 ? '31.5%' : '47.5%',
    borderRadius: 0,
    padding: 0,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  productImageContainer: {
    height: 180,
    backgroundColor: '#F9F8F6',
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    padding: 12,
    marginTop: 0,
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
    marginTop: 24,
    marginBottom: 24,
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
  heroBannerNew: {
    height: 320,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  heroBannerImageNew: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  heroBannerOverlayNew: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // slightly darker for better text readability
    padding: 20,
  },
  heroBannerTopTextNew: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  heroBannerMainTextNew: {
    color: '#FFF',
    fontSize: 36, // Reduced from 42
    lineHeight: 40,
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroBannerDiscountNew: {
    color: '#FFF',
    fontSize: 40, // Reduced from 48
    lineHeight: 44,
    fontFamily: 'Inter-Bold',
    marginBottom: 24,
  },
  heroBannerBtnNew: {
    backgroundColor: '#111111', // Solid background instead of transparent
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  heroBannerBtnTextNew: {
    color: '#FFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  promoSetSaleBanner: {
    paddingTop: 10,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
  },
  promoSetSaleTextContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  promoSetSaleTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#000',
    marginBottom: 4,
  },
  promoSetSaleSubtitle: {
    fontSize: 22,
    fontFamily: 'Inter-Medium',
    color: '#111',
    marginBottom: 16,
  },
  promoSetSalePrice: {
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  promoSetSaleArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoSetSaleImage: {
    width: '110%',
    height: 220,
  },
  promoCircleBadge: {
    position: 'absolute',
    right: 30,
    top: 5,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FDF7F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  promoCircleUpTo: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#902C2C',
    marginBottom: -4,
  },
  promoCircleMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCircleNumber: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#902C2C',
  },
  promoCirclePercentContainer: {
    flexDirection: 'column',
    marginLeft: 2,
    marginTop: 4,
  },
  promoCirclePercent: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#902C2C',
    lineHeight: 11,
  },
  promoCircleOff: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#902C2C',
    lineHeight: 11,
  },
  offersSectionNew: {
    marginBottom: 24,
  },
  offersListNew: {
    gap: 16,
    paddingRight: 20,
    paddingTop: 10,
  },
  offerCardNew: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE2D5',
    borderRadius: 8,
    padding: 12,
    width: 280,
    backgroundColor: '#FFFFFF',
  },
  offerIconNew: {
    backgroundColor: '#A06E50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  offerIconTextNew: {
    color: '#FFF',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  offerTextNew: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#333',
  },
  shopByCategoriesSection: {
    marginBottom: 24,
  },
  shopByCategoriesList: {
    gap: 20,
    paddingRight: 20,
    paddingTop: 10,
  },
  shopCategoryItem: {
    alignItems: 'center',
    width: 80,
  },
  shopCategoryCircle: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: '#E0D8D0', // Darkened further for solid visibility
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  shopCategoryIcon: {
    width: 65,
    height: 65,
  },
  shopCategoryCircleText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20, // Increased font size for larger circle
    color: '#111111',
    letterSpacing: 2,
  },
  shopCategoryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#111',
    textAlign: 'center',
  },
  productTagNew: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#F17E4F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  productTagTextNew: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
  },
  productOriginalPrice: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textDecorationLine: 'line-through',
    marginHorizontal: 4,
  },
  productDiscount: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#A06E50', // Earthy tone for discount
  },
  arContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  arCameraFeed: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  arScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  arCanvasContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginTop: 80,
  },
  arHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  arRoundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  arTitleContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  arTitleText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
    color: '#111',
  },
  arSubTitleText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 2,
  },
  arFooter: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    zIndex: 10,
  },
  arActionBtn: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  arActionBtnText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  }
});
