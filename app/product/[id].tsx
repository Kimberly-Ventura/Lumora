import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Image, 
  Pressable, 
  Dimensions, 
  Platform,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/Skeleton';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { isFavorite, addToWishlist, removeFromWishlist } from '@/lib/wishlistHelper';
import { addToCart, updateCartItem } from '@/lib/cartHelper';
import { supabase } from '@/lib/supabase';

const { width: windowWidth } = Dimensions.get('window');

// Premium Color Swatches
const SWATCHES = [
  { name: 'Brown', hex: '#D09252' },
  { name: 'Sky Blue', hex: '#5DADE2' },
  { name: 'Purple', hex: '#A569BD' },
  { name: 'Grey', hex: '#D5D8DC' },
];

const PRODUCT_CATALOG: Record<string, any> = {
  '1': { 
    name: 'Verona Luxe Sofa', 
    price: '₱144,420', 
    image: require('@/assets/images/verona_sofa_clean.png'), 
    category: 'Sofa', 
    description: 'A timeless expression of Italian craftsmanship. Deep cushioning, hand-stitched upholstery, and a solid walnut base. Engineered for ultimate comfort without compromising structural grace.',
    specs: ['Handcrafted in Italy', 'Free White-Glove Delivery', '5-Year Frame Warranty']
  },
  '2': { 
    name: 'Vero Modular Chair', 
    price: '₱72,500', 
    image: require('@/assets/images/armchair_clean.png'), 
    category: 'Chair', 
    description: 'Effortless comfort meets architectural precision. Premium custom-tint linen with a solid, light oak frame. Designed to make your space feel open, breathable, and deeply refined.',
    specs: ['Sustainable Linen', 'Solid Ashwood Construction', 'Ergonomic Curved Back']
  },
  '3': { 
    name: 'Rustic Seat Bar Stool', 
    price: '₱39,440', 
    image: require('@/assets/images/rustic_chair_clean.png'), 
    category: 'Chair', 
    description: 'Raw beauty with refined execution. Reclaimed European oak combined with a robust hand-woven rattan seat. A stunning highlight for any high-end kitchen island or home lounge.',
    specs: ['Reclaimed French Oak', 'Hand-woven Rattan', 'Adjustable Leveling Glides']
  },
  '4': { 
    name: 'Nova Line Lamp', 
    price: '₱24,360', 
    image: require('@/assets/images/nova_lamp_clean.png'), 
    category: 'Lamp', 
    description: 'Sculptural minimalism at its absolute finest. A sleek, hand-burnished brass stem with a delicate mouth-blown glass diffuser that emits a warm, ambient, museum-grade glow.',
    specs: ['Mouth-blown Opal Glass', 'Dimmable LED Integrated', 'Solid Brass Frame']
  },
  '5': { 
    name: 'Aurelius Lounge Chair', 
    price: '₱109,620', 
    image: require('@/assets/images/lounge_chair_clean.png'), 
    category: 'Chair', 
    description: 'The pinnacle of luxury relaxation. Generous, sweeping proportions featuring custom cashmere-blend upholstery resting elegantly on a smooth-gliding silent rotating base.',
    specs: ['Cashmere-blend Upholstery', '360° Silent Swivel Base', 'Memory Foam Cushioning']
  },
  '6': { 
    name: 'Nordic Dining Table', 
    price: '₱185,600', 
    image: require('@/assets/images/dining-table.png'), 
    category: 'Table', 
    description: 'Solid European white oak displaying pristine clean Scandinavian lines. Seats up to eight people comfortably with an organic, natural oiled finish that highlights the authentic wood grain.',
    specs: ['Solid White Oak', ' seats 8 Comfortably', 'Oiled Matte Surface Finish']
  },
};

export default function ProductDetailsScreen() {
  const { id, editMode, editColor } = useLocalSearchParams<{ id: string, editMode?: string, editColor?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedColor, setSelectedColor] = useState(SWATCHES[0].hex);
  const [isFavorited, setIsFavorited] = useState(false);
  const [dbProduct, setDbProduct] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [productNotFound, setProductNotFound] = useState(false);

  useEffect(() => {
    const fetchProduct = async (silent = false) => {
      if (!id || PRODUCT_CATALOG[id as string]) {
        setDbProduct(null);
        return;
      }
      try {
        if (!silent) setLoadingDb(true);
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('id', id)
          .eq('is_active', true)  // respect the admin hide/show toggle
          .single();

        if (error) {
          console.error('Error fetching product from DB:', error);
          setDbProduct(null);
          setProductNotFound(true);
          return;
        }

        if (data) {
          const isOnSale = data.on_sale && data.discount_percentage && data.discount_percentage > 0;
          const numericPrice = parseFloat(data.price);
          setDbProduct({
            name: data.name,
            price: `₱${numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            originalPrice: isOnSale ? `₱${numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
            salePrice: isOnSale ? `₱${(numericPrice * (1 - data.discount_percentage / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
            onSale: isOnSale,
            discount: isOnSale ? `${data.discount_percentage}% OFF` : null,
            stock: data.stock,
            image: data.image_url ? { uri: data.image_url } : require('@/assets/images/armchair_clean.png'),
            category: data.categories?.name || 'Chair',
            description: data.description || 'A curated piece from the Lumora archive.',
            specs: ['Premium Quality', 'Custom Materials', 'Lumora Certified'],
            modelPath: data.model_url || undefined,
            isDbProduct: true
          });
          setProductNotFound(false);
        } else {
          // Product exists but is hidden (is_active = false) — treat as not found
          setDbProduct(null);
          setProductNotFound(true);
        }
      } catch (err) {
        console.error('Error in fetchProduct:', err);
        setDbProduct(null);
      } finally {
        if (!silent) setLoadingDb(false);
      }
    };

    fetchProduct();

    const channel = supabase
      .channel(`product-detail-${id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `id=eq.${id}` },
        () => {
          fetchProduct(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const product = dbProduct || PRODUCT_CATALOG[id as string] || {
    name: 'Lumora Piece',
    price: '$–',
    image: require('@/assets/images/armchair_clean.png'),
    category: 'Furniture',
    description: 'A curated piece from the Lumora archive.',
    specs: ['Premium Quality', 'Custom Materials']
  };

  useEffect(() => {
    if (editColor) {
      setSelectedColor(decodeURIComponent(editColor));
    }
  }, [editColor]);

  useEffect(() => {
    checkFavorite();
  }, [id]);

  const { width: currentWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && currentWidth > 768;
  const containerWidth = isWeb ? Math.min(currentWidth, 1200) : currentWidth;

  // Show unavailable screen for hidden/deleted DB products
  if (productNotFound && !PRODUCT_CATALOG[id as string]) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="cube-outline" size={64} color="#CCC" />
        <ThemedText style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: '#111', marginTop: 16 }}>
          Product Unavailable
        </ThemedText>
        <ThemedText style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
          This product is no longer available or has been removed.
        </ThemedText>
        <Pressable
          style={{ marginTop: 24, backgroundColor: '#111', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 }}
          onPress={() => router.back()}
        >
          <ThemedText style={{ color: '#FFF', fontFamily: 'Inter-SemiBold', fontSize: 14 }}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const checkFavorite = async () => {
    if (id) {
      const fav = await isFavorite(id);
      setIsFavorited(fav);
    }
  };

  const toggleFavorite = async () => {
    if (!id) return;
    if (isFavorited) {
      await removeFromWishlist(id);
      setIsFavorited(false);
    } else {
      await addToWishlist({
        id,
        name: product.name,
        brand: product.category,
        price: product.price,
        image: product.image,
        category: product.category
      });
      setIsFavorited(true);
    }
  };



  const handleAddToCart = async () => {
    if (!id) return;

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push('/signin');
      return;
    }

    if (editMode === 'true') {
      const oldColor = editColor ? decodeURIComponent(editColor) : undefined;
      await updateCartItem(id, oldColor, {
        selectedColor
      });
    } else {
      await addToCart({
        id,
        name: product.name,
        brand: (product as any).brand || product.category,
        price: product.price,
        image: product.image,
        category: product.category,
        selectedColor
      });
    }
    router.push('/(tabs)/cart');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Fixed Layout Main Container */}
      <View style={[styles.mainContainer, isDesktop && styles.webScrollContent]}>
        <View style={[styles.innerContent, { width: containerWidth, flex: 1 }]}>
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <Pressable 
              style={[styles.headerBtn, { backgroundColor: '#FFFFFF', borderColor: '#EEE' }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            
            <ThemedText style={styles.headerTitle}>Product Details</ThemedText>
            
            <Pressable 
              style={[styles.headerBtn, { backgroundColor: '#FFFFFF', borderColor: '#EEE' }]}
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFavorited ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorited ? "#E74C3C" : colors.text} 
              />
            </Pressable>
          </View>

          {/* Responsive Layout split for Web vs Single-column for Mobile */}
          <View style={[styles.layoutWrapper, isDesktop && styles.webLayout, { flex: 1 }]}>
            
            {/* Centerpiece & Swatches (Left Column on Web) */}
            <View style={[styles.visualSection, isDesktop && styles.webVisualSection]}>
              <View style={[styles.centerpieceContainer, { backgroundColor: '#FFFFFF' }]}>
                {loadingDb ? (
                  <View style={[styles.loadingContainer, { padding: 20 }]}>
                    <Skeleton width="100%" height="100%" borderRadius={24} />
                  </View>
                ) : (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={product.image} 
                      style={[styles.productImage, { tintColor: selectedColor === SWATCHES[0].hex ? undefined : selectedColor }]} 
                      resizeMode="contain" 
                    />
                  </View>
                )}



                {/* Sidebar Color Swatches */}
                {!loadingDb && (
                  <View style={styles.swatchSidebar}>
                    {SWATCHES.map((swatch, idx) => {
                      const isSelected = selectedColor === swatch.hex;
                      return (
                        <Pressable
                          key={idx}
                          style={[
                            styles.swatchOuterCircle,
                            isSelected && { borderColor: '#A06E50' }
                          ]}
                          onPress={() => setSelectedColor(swatch.hex)}
                        >
                          <View style={[styles.swatchInnerCircle, { backgroundColor: swatch.hex }]} />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {/* Info, Specs, and CTA (Right Column on Web) */}
            <View style={[styles.infoSection, isDesktop && styles.webInfoSection]}>
              {loadingDb ? (
                <>
                  <View style={styles.titlePriceRow}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <Skeleton width={100} height={14} />
                      <Skeleton width="80%" height={32} />
                    </View>
                    <Skeleton width={80} height={28} />
                  </View>
                  <View style={[styles.divider, { backgroundColor: '#E7E0D8' }]} />
                  <View style={styles.descriptionContainer}>
                    <Skeleton width={120} height={18} style={{ marginBottom: 12 }} />
                    <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="90%" height={16} style={{ marginBottom: 24 }} />
                  </View>
                  <View style={styles.specsContainer}>
                    <Skeleton width={200} height={16} style={{ marginBottom: 12 }} />
                    <Skeleton width={180} height={16} style={{ marginBottom: 12 }} />
                    <Skeleton width={220} height={16} />
                  </View>
                  {isDesktop && (
                    <View style={{ marginTop: 40 }}>
                      <Skeleton width="100%" height={56} borderRadius={28} />
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* Product Heading & Price */}
                  <View style={styles.titlePriceRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.categoryLabel}>{product.category.toUpperCase()}</ThemedText>
                      <ThemedText style={styles.productName}>{product.name}</ThemedText>
                      {product.stock === 0 && <ThemedText style={{ color: '#DC2626', fontFamily: 'Inter-Bold', marginTop: 4 }}>OUT OF STOCK</ThemedText>}
                      {product.stock > 0 && product.stock < 10 && <ThemedText style={{ color: '#EA580C', fontFamily: 'Inter-SemiBold', marginTop: 4 }}>Only {product.stock} left in stock</ThemedText>}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {product.onSale ? (
                        <>
                          <ThemedText style={[styles.productPrice, { color: '#DC2626' }]}>{product.salePrice}</ThemedText>
                          <ThemedText style={[styles.productPrice, { fontSize: 14, textDecorationLine: 'line-through', color: '#999', marginTop: 2 }]}>{product.originalPrice}</ThemedText>
                        </>
                      ) : (
                        <ThemedText style={styles.productPrice}>{product.price}</ThemedText>
                      )}
                    </View>
                  </View>

              <View style={[styles.divider, { backgroundColor: '#E7E0D8' }]} />

              {/* Description */}
              <View style={styles.descriptionContainer}>
                <ThemedText style={styles.sectionHeadingText}>Description</ThemedText>
                <ScrollView 
                  style={styles.descriptionScroll} 
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <ThemedText style={styles.bodyDescription}>
                    {product.description}
                  </ThemedText>
                </ScrollView>
              </View>

              {/* Specs Checkmark Grid */}
              <View style={styles.specsContainer}>
                {product.specs?.map((spec: string, idx: number) => (
                  <View key={idx} style={styles.specRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#A06E50" />
                    <ThemedText style={styles.specText}>{spec}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Desktop CTA */}
              {isDesktop && (
                <View style={{ marginTop: 40 }}>
                  <Pressable 
                    style={[styles.addToCartBtn, { backgroundColor: product.stock === 0 ? '#999' : '#111111' }]}
                    onPress={product.stock === 0 ? undefined : handleAddToCart}
                    disabled={product.stock === 0}
                  >
                    <ThemedText style={styles.addToCartText}>
                      {product.stock === 0 ? 'Out of Stock' : (editMode === 'true' ? 'Save Changes' : '+Add to Cart')}
                    </ThemedText>
                  </Pressable>
                </View>
              )}
                </>
              )}
            </View>

          </View>
        </View>
      </View>

      {/* Sticky Bottom Bar for Mobile */}
      {!isDesktop && (
        <View style={styles.bottomBarContainer}>
          <View style={[styles.bottomBar, { width: containerWidth }]}>
            {loadingDb ? (
              <>
                <View style={styles.bottomBarLeft}>
                  <Skeleton width={36} height={36} borderRadius={18} />
                  <View style={{ marginLeft: 12 }}>
                    <Skeleton width={40} height={12} style={{ marginBottom: 4 }} />
                    <Skeleton width={80} height={16} />
                  </View>
                </View>
                <View style={styles.buttonWrapper}>
                  <Skeleton width="100%" height={48} borderRadius={24} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.bottomBarLeft}>
                  <View style={styles.categoryCircle}>
                    <Ionicons 
                      name={product.category === 'Lamp' ? 'bulb-outline' : 'bed-outline'} 
                      size={18} 
                      color="#FFF" 
                    />
                  </View>
                  <View>
                    <ThemedText style={styles.bottomBarLabel}>Price</ThemedText>
                    <ThemedText style={styles.bottomBarPrice}>{product.price}</ThemedText>
                  </View>
                </View>
                <View style={styles.buttonWrapper}>
                  <Pressable 
                    style={[styles.addToCartBtn, { backgroundColor: product.stock === 0 ? '#999' : '#111111' }]}
                    onPress={product.stock === 0 ? undefined : handleAddToCart}
                    disabled={product.stock === 0}
                  >
                    <ThemedText style={styles.addToCartText}>
                      {product.stock === 0 ? 'Out of Stock' : (editMode === 'true' ? 'Save Changes' : '+Add to Cart')}
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      )}

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  webScrollContent: {
    alignItems: 'center',
  },
  innerContent: {
    paddingHorizontal: Spacing.m,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'web' ? 20 : 100,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  layoutWrapper: {
    width: '100%',
    flex: 1,
  },
  webLayout: {
    flexDirection: 'row',
    gap: 40,
    marginTop: Spacing.m,
  },
  visualSection: {
    width: '100%',
    marginBottom: Spacing.l,
  },
  webVisualSection: {
    flex: 1.5,
    marginBottom: 0,
  },
  centerpieceContainer: {
    height: Platform.OS === 'web' ? 560 : 300,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  threedContainer: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionScroll: {
    flex: 1,
  },
  toggleContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toggleBtnActive: {
    backgroundColor: '#111111',
  },
  toggleText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#666666',
    letterSpacing: 0.5,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  imageContainer: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  swatchSidebar: {
    position: 'absolute',
    right: 16,
    top: '25%',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  swatchOuterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchInnerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  threedBadge: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  threedBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  infoSection: {
    width: '100%',
    flex: 1,
  },
  webInfoSection: {
    flex: 1,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.s,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#A06E50',
    letterSpacing: 2,
    marginBottom: 4,
  },
  productName: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
    letterSpacing: -0.5,
  },
  productPrice: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.m,
  },
  descriptionContainer: {
    marginBottom: Spacing.m,
    flex: 1,
  },
  sectionHeadingText: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
    marginBottom: 8,
  },
  bodyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 22,
  },
  specsContainer: {
    gap: 8,
    marginTop: Spacing.m,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#555',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F6F1EB',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingVertical: 14,
    paddingHorizontal: Spacing.m,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 8,
  },
  webBottomBar: {
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    bottom: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  bottomBarPrice: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  buttonWrapper: {
    flex: 0.8,
  },
  addToCartBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  qrContainer: {
    marginTop: 25,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  qrTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#111',
  },
  qrText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 15,
  },
  qrBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: 15,
    borderRadius: 16,
  },
  qrBorder: {
    padding: 8,
    backgroundColor: '#F6F1EB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  qrIndicatorText: {
    fontSize: 8,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    letterSpacing: 1.5,
  },
  wifiTip: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#777',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ipPillContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  ipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 5,
  },
  ipPillText: {
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
    letterSpacing: 1,
  },
  ipInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D09252',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    width: 180,
  },
  ipInput: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#111',
    padding: 0,
    height: 20,
    outlineStyle: 'none' as any, // Remove input focus highlight on Web
  },
  ipSaveBtn: {
    backgroundColor: '#A06E50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ipCancelBtn: {
    backgroundColor: '#EEE',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
