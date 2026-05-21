import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Image, 
  Pressable, 
  TextInput, 
  Dimensions, 
  Platform,
  Modal,
  useWindowDimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { FooterHero } from '@/components/FooterHero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Product3DViewer } from '@/components/Product3DViewer';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMobileQRUrl } from '@/lib/qrHelper';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/wishlistHelper';
import { supabase } from '@/lib/supabase';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const CATEGORIES = ['All', 'Chair', 'Table', 'Sofa', 'Lamp'];

const PRODUCTS = [
  { id: '1', name: 'Verona Luxe Sofa', brand: 'Lumora Luxe', price: '₱144,420', image: require('@/assets/images/verona_sofa_clean.png'), category: 'Sofa', rating: 4.9, color: '#C8B195' },
  { id: '2', name: 'Vero Modular Chair', brand: 'Easy Habits', price: '₱72,500', image: require('@/assets/images/armchair_clean.png'), category: 'Chair', rating: 4.8, color: '#D09252', modelPath: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb' },
  { id: '3', name: 'Rustic Bar Stool', brand: 'Reclaimed Oak', price: '₱39,440', image: require('@/assets/images/rustic_chair_clean.png'), category: 'Chair', rating: 4.7, color: '#A06E50', modelPath: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb' },
  { id: '4', name: 'Nova Line Lamp', brand: 'Sculptural Brass', price: '₱24,360', image: require('@/assets/images/nova_lamp_clean.png'), category: 'Lamp', rating: 4.9, color: '#E5C158' },
  { id: '5', name: 'Aurelius Lounge', brand: 'Cashmere Blend', price: '₱109,620', image: require('@/assets/images/lounge_chair_clean.png'), category: 'Chair', rating: 4.9, color: '#8E9AA6', modelPath: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb' },
  { id: '6', name: 'Nordic Dining Table', brand: 'Solid Oak', price: '₱185,600', image: require('@/assets/images/dining-table.png'), category: 'Table', rating: 4.8, color: '#D2C3B2' },
];

const SHOWCASE_SWATCHES = [
  { name: 'Original Linen', hex: '#ORIGINAL', displayColor: '#E2DDD9' },
  { name: 'Classic Terracotta', hex: '#D09252' },
  { name: 'Serene Blue', hex: '#829FAD' },
  { name: 'Warm Charcoal', hex: '#4A4A4A' },
  { name: 'Champagne Linen', hex: '#E7E0D8' },
];

export default function ShopScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[1]); // Default to Vero Modular Chair
  const [favorites, setFavorites] = useState<string[]>([]);
  const [arModalVisible, setArModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('http://localhost:8081/shop');
  const [showcaseColor, setShowcaseColor] = useState('#ORIGINAL');

  const [dbProducts, setDbProducts] = useState<any[]>([]);

  const fetchDbProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products from DB:', error);
        return;
      }

      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.categories?.name || 'Lumora Design',
          price: `₱${parseFloat(item.price).toLocaleString('en-US')}`,
          image: item.image_url ? { uri: item.image_url } : require('@/assets/images/armchair_clean.png'),
          category: item.categories?.name || 'Chair',
          rating: 4.8,
          color: '#D09252',
          modelPath: item.model_url || undefined,
          description: item.description || '',
          isDbProduct: true
        }));
        setDbProducts(mapped);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      fetchDbProducts();
    }, [])
  );

  const loadFavorites = async () => {
    const list = await getWishlist();
    setFavorites(list.map(item => item.id));
  };

  useEffect(() => {
    setShowcaseColor('#ORIGINAL');
  }, [selectedProduct]);

  const [isLocalhostWeb, setIsLocalhostWeb] = useState(false);
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [currentIp, setCurrentIp] = useState('');
  const [tempIp, setTempIp] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setCurrentUrl(getMobileQRUrl('/shop'));
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsLocalhostWeb(isLocal);
      const saved = localStorage.getItem('lumora-lan-ip') || '';
      setCurrentIp(saved);
      setTempIp(saved);
    }
  }, []);

  const handleSaveIp = () => {
    if (tempIp.trim()) {
      localStorage.setItem('lumora-lan-ip', tempIp.trim());
      setCurrentIp(tempIp.trim());
      setCurrentUrl(getMobileQRUrl('/shop'));
    } else {
      localStorage.removeItem('lumora-lan-ip');
      setCurrentIp('');
      setCurrentUrl(getMobileQRUrl('/shop'));
    }
    setIsEditingIp(false);
  };

  const allProducts = dbProducts.length > 0 ? dbProducts : PRODUCTS;

  const toggleFavorite = async (id: string) => {
    const isFav = favorites.includes(id);
    if (isFav) {
      const updatedList = await removeFromWishlist(id);
      setFavorites(updatedList.map(item => item.id));
    } else {
      const product = allProducts.find(p => p.id === id);
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

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || product.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const { width: currentWidth } = useWindowDimensions();
  const isMobile = currentWidth < 768;
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && currentWidth > 992;
  const contentWidth = isWeb ? Math.min(currentWidth, 1200) : currentWidth;
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
        <View style={[styles.innerLayout, { width: contentWidth }, isDesktop && styles.desktopLayout]}>
          
          {/* Main Area: Grid & 3D Interactive Spotlight */}
          <View style={[styles.mainArea, isDesktop && { flex: 1, marginRight: 30 }]}>
            
            {/* Header Titles */}
            <View style={styles.titleContainer}>
              <ThemedText style={styles.subtitle}>EXCLUSIVE SHOP</ThemedText>
              <ThemedText style={styles.title}>Understated Masterpieces</ThemedText>
            </View>

            {/* 3D AR Interactive Showcase Box */}
            <View style={[styles.showcaseBox, { backgroundColor: '#FFFFFF' }]}>
              <View style={[styles.showcaseHeader, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 14 }]}>
                <View style={{ flex: isMobile ? undefined : 1 }}>
                  <ThemedText style={styles.showcaseTitle}>{selectedProduct.name}</ThemedText>
                  <ThemedText style={styles.showcaseSubtitle}>Interactive 3D Preview</ThemedText>
                </View>

                <View style={[
                  isMobile ? { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 } : { flexDirection: 'row', alignItems: 'center' }
                ]}>
                  {/* 3D Color Swapping (Only shown if modelPath is present) */}
                  {(selectedProduct as any).modelPath && (
                    <View style={[styles.showcaseSwatches, { marginRight: isMobile ? 0 : 20 }]}>
                      {SHOWCASE_SWATCHES.map((swatch, idx) => {
                        const isSelected = showcaseColor === swatch.hex;
                        return (
                          <Pressable
                            key={idx}
                            style={[
                              styles.showcaseSwatchCircle,
                              { backgroundColor: swatch.displayColor || swatch.hex },
                              isSelected && styles.showcaseSwatchCircleSelected
                            ]}
                            onPress={() => setShowcaseColor(swatch.hex)}
                          />
                        );
                      })}
                    </View>
                  )}

                  {Platform.OS !== 'web' ? (
                    <Pressable 
                      style={styles.arBadge}
                       onPress={() => setArModalVisible(true)}
                    >
                      <Ionicons name="cube-outline" size={16} color="#FFF" />
                      <ThemedText style={styles.arBadgeText}>VIEW IN AR</ThemedText>
                    </Pressable>
                  ) : (
                    <View style={[styles.arBadge, { backgroundColor: '#F6F1EB', borderWidth: 1, borderColor: '#E7E0D8' }]}>
                      <Ionicons name="phone-portrait-outline" size={12} color="#888" />
                      <ThemedText style={[styles.arBadgeText, { color: '#888' }]}>MOBILE AR ONLY</ThemedText>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.canvasContainer, { height: isMobile ? 260 : 480 }]}>
                <Product3DViewer 
                  modelPath={(selectedProduct as any).modelPath} 
                  customColor={showcaseColor} 
                  autoRotate={true}
                  enableZoom={false}
                  enablePan={false}
                />
              </View>

              {/* Dynamic 3D Example Disclaimer */}
              <ThemedText style={styles.disclaimerText}>
                *3D showcase is for aesthetic representation only; actual materials and finishes are customized post-purchase.
              </ThemedText>
            </View>

            {/* Catalog Product Grid */}
            <View style={styles.gridSection}>
              <ThemedText style={styles.gridHeading}>All Creations ({filteredProducts.length})</ThemedText>
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
                          width: isMobile ? '48%' : '47.5%',
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
            </View>

          </View>

          {/* Sidebar Area: Search & Filters (On the right on Desktop) */}
          <View style={[styles.sidebarArea, isDesktop ? { width: 320 } : { width: '100%', marginTop: 30 }]}>
            
            {/* Search Box */}
            <View style={[styles.sidebarCard, { backgroundColor: '#FFFFFF' }]}>
              <ThemedText style={styles.sidebarSectionTitle}>Search</ThemedText>
              <View style={[styles.searchContainer, { backgroundColor: '#F9F8F6' }]}>
                <Ionicons name="search-outline" size={18} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Find creation..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Category Filter List */}
            <View style={[styles.sidebarCard, { backgroundColor: '#FFFFFF', marginTop: 20 }]}>
              <ThemedText style={styles.sidebarSectionTitle}>Categories</ThemedText>
              <View style={styles.filterList}>
                {CATEGORIES.map(cat => {
                  const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setActiveCategory(cat)}
                      style={[
                        styles.filterRow,
                        isActive && { backgroundColor: '#F9F8F6' }
                      ]}
                    >
                      <ThemedText 
                        style={[
                          styles.filterLabel,
                          isActive && { fontFamily: 'Inter-SemiBold', color: '#A06E50' }
                        ]}
                      >
                        {cat}
                      </ThemedText>
                      {isActive && <Ionicons name="checkmark" size={16} color="#A06E50" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Simulated AR Helper Guide (Shows QR Code on Web) */}
            <View style={[styles.sidebarCard, { backgroundColor: '#E7E0D8', marginTop: 20 }]}>
              <Ionicons name="camera-outline" size={24} color="#111" />
              <ThemedText style={styles.arGuideTitle}>Bring Room to Life</ThemedText>
              <ThemedText style={styles.arGuideText}>
                {Platform.OS === 'web' 
                  ? "Scan this QR code with your mobile camera to instantly open this shop on your phone and launch the immersive AR placement simulation!"
                  : "Use our dynamic AR placement simulation tool to place premium designs directly inside your home workspace!"
                }
              </ThemedText>
              {Platform.OS === 'web' ? (
                <View style={styles.qrSection}>
                  <View style={styles.qrBorder}>
                    <Image 
                      source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=111111&bgcolor=F6F1EB&data=${encodeURIComponent(currentUrl)}` }} 
                      style={styles.qrCodeImage}
                    />
                  </View>
                  <View style={styles.qrLabelRow}>
                    <Ionicons name="scan-outline" size={14} color="#555" />
                    <ThemedText style={styles.qrLabelText}>SCAN WITH MOBILE</ThemedText>
                  </View>
                  <ThemedText style={styles.wifiTip}>Connect phone to the same Wi-Fi network</ThemedText>

                  {/* Dynamic IP Configuration Pill (Web Localhost Only) */}
                  {isLocalhostWeb && (
                    <View style={styles.ipPillContainer}>
                      {isEditingIp ? (
                        <View style={styles.ipInputRow}>
                          <TextInput
                            style={styles.ipInput}
                            placeholder="e.g. 192.168.1.15"
                            placeholderTextColor="#999"
                            value={tempIp}
                            onChangeText={setTempIp}
                          />
                          <Pressable style={styles.ipSaveBtn} onPress={handleSaveIp}>
                            <Ionicons name="checkmark" size={12} color="#FFF" />
                          </Pressable>
                          <Pressable style={styles.ipCancelBtn} onPress={() => setIsEditingIp(false)}>
                            <Ionicons name="close" size={12} color="#555" />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable style={styles.ipPill} onPress={() => setIsEditingIp(true)}>
                          <Ionicons name="settings-outline" size={10} color="#666" />
                          <ThemedText style={styles.ipPillText}>
                            {currentIp ? `IP: ${currentIp}` : 'SET LAN IP FOR MOBILE'}
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <Pressable 
                  style={styles.arGuideBtn}
                  onPress={() => setArModalVisible(true)}
                >
                  <ThemedText style={styles.arGuideBtnText}>Launch AR Mode</ThemedText>
                </Pressable>
              )}
            </View>

          </View>

        </View>

        {/* Footer */}
        <FooterHero />
      </ScrollView>

      {/* Simulated Fullscreen AR Mode Overlay Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={arModalVisible}
        onRequestClose={() => setArModalVisible(false)}
      >
        <View style={styles.arContainer}>
          {/* Simulated Living Room Camera Background */}
          <Image 
            source={require('@/assets/images/hero-sofa.png')} 
            style={styles.arCameraFeed} 
            resizeMode="cover"
          />
          <View style={styles.arScrim} />

          {/* Floating 3D Chair Model in center */}
          <View style={styles.arCanvasContainer}>
            <Product3DViewer customColor={selectedProduct.color} autoRotate={false} />
          </View>

          {/* Symmetrical Top Actions */}
          <View style={styles.arHeader}>
            <Pressable 
              style={styles.arRoundBtn} 
              onPress={() => setArModalVisible(false)}
            >
              <Ionicons name="close" size={20} color="#111" />
            </Pressable>
            <View style={styles.arTitleContainer}>
              <ThemedText style={styles.arTitleText}>3D AR PLACEMENT</ThemedText>
              <ThemedText style={styles.arSubTitleText}>Live Scale Simulation</ThemedText>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Bottom Placement Actions */}
          <View style={styles.arFooter}>
            <Pressable 
              style={styles.arActionBtn}
              onPress={() => alert('Scale locked! Item calibrated to room coordinates.')}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#111" />
              <ThemedText style={styles.arActionBtnText}>Lock Position</ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.arActionBtn, { backgroundColor: '#111' }]}
              onPress={() => {
                alert('Snapshot saved to library!');
                setArModalVisible(false);
              }}
            >
              <Ionicons name="camera" size={18} color="#FFF" />
              <ThemedText style={[styles.arActionBtnText, { color: '#FFF' }]}>Capture Snapshot</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  innerLayout: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.xl,
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainArea: {
    width: '100%',
  },
  sidebarArea: {
    flexShrink: 0,
  },
  titleContainer: {
    marginBottom: Spacing.xl,
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
  },
  showcaseBox: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 24,
    marginBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  showcaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  showcaseTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#111',
  },
  showcaseSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  arBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  arBadgeText: {
    color: '#F6F1EB',
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
  },
  canvasContainer: {
    height: 480,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FDFBF9',
    marginTop: 10,
  },
  gridSection: {
    marginBottom: Spacing.xl,
  },
  gridHeading: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '47.5%',
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
  sidebarCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  sidebarSectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#111',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#111',
    marginLeft: 8,
  },
  filterList: {
    gap: 4,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  arGuideTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#111',
    marginTop: 12,
    marginBottom: 8,
  },
  arGuideText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 16,
  },
  arGuideBtn: {
    backgroundColor: '#111111',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  arGuideBtnText: {
    color: '#F6F1EB',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  arContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  arCameraFeed: {
    ...StyleSheet.absoluteFillObject,
  },
  arScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  arCanvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  arHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  arRoundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arTitleContainer: {
    alignItems: 'center',
  },
  arTitleText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  arSubTitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  arFooter: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 15,
    zIndex: 10,
  },
  arActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  arActionBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#111',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  qrBorder: {
    padding: 10,
    backgroundColor: '#F6F1EB',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  qrCodeImage: {
    width: 120,
    height: 120,
  },
  qrLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  qrLabelText: {
    fontSize: 9,
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
  showcaseSwatches: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 20,
  },
  showcaseSwatchCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    cursor: 'pointer' as any,
  },
  showcaseSwatchCircleSelected: {
    borderColor: '#A06E50',
    borderWidth: 2,
    transform: [{ scale: 1.25 }] as any,
  },
  disclaimerText: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginTop: -8,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
