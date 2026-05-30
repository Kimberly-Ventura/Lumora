import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  Pressable,
  TextInput,
} from 'react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/wishlistHelper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/Skeleton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

// Section filter metadata
const SECTION_META: Record<string, { title: string; tagColor: string }> = {
  flash:      { title: 'Flash Sales',  tagColor: '#D9534F' },
  bestseller: { title: 'Best Sellers', tagColor: '#F17E4F' },
  new:        { title: 'New Arrivals', tagColor: '#5A8D73' },
};

const CATEGORY_COLORS: Record<string, string> = {
  chair:       '#A06E50',
  sofa:        '#6B8EA6',
  table:       '#7A9E7E',
  lamp:        '#C8A951',
  bed:         '#9B7BB8',
  'new arrival': '#5A8D73',
};

// Maps rooms to their appropriate furniture categories
const ROOM_CATEGORY_MAP: Record<string, string[]> = {
  'office': ['Chair', 'Table', 'Lamp', 'Desk'],
  'living room': ['Sofa', 'Chair', 'Lamp', 'Table'],
  'bedroom': ['Bed', 'Lamp', 'Table', 'Chair'],
  'dining room': ['Table'],
  'dining': ['Table'],
};

export default function ProductListScreen() {
  const router = useRouter();
  const { filter, category, room, search } = useLocalSearchParams<{ filter?: string; category?: string; room?: string; search?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [searchQuery, setSearchQuery] = useState(search || '');
  const currentCategory = category || 'All';
  const [chipOptions, setChipOptions] = useState<string[]>(['All', 'Chair', 'Table', 'Sofa', 'Lamp', 'Bed']);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      fetchProducts();
    }, [])
  );

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('name');
      if (data && !error) {
        const names = data.map((c: any) => c.name);
        let uniqueNames = Array.from(new Set(names)) as string[];
        
        // If viewing a room collection, only show chips relevant to that room
        if (room && ROOM_CATEGORY_MAP[room]) {
          const allowed = ROOM_CATEGORY_MAP[room].map(c => c.toLowerCase());
          uniqueNames = uniqueNames.filter(n => allowed.includes(n.toLowerCase()));
        }
        
        setChipOptions(['All', ...uniqueNames]);
      }
    } catch (err) {
      console.error('Error fetching categories in product-list:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    const catChannel = supabase
      .channel(`list-categories-changes-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(catChannel);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`list-products-changes-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts(true);
      })
      .subscribe();
      
    const interval = setInterval(() => {
      fetchProducts(true); // Silent fetch
    }, 5000);
      
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [category, filter, search]);

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)          // only live products
        .order('created_at', { ascending: false });

      // Server-side category filter
      if (category && category.toLowerCase() !== 'new arrival' && category.toLowerCase() !== 'all') {
        query = query.ilike('categories.name', category);
      }

      // Handle the promo filters
      if (filter === 'flash') {
        query = query.eq('on_sale', true);
      } else if (filter === 'bestseller') {
        query = query.eq('is_best_seller', true);
      }

      const { data, error } = await query;
      if (error) {
        console.error('product-list fetch error:', error.message);
        setProducts([]);
      } else {
        const mapped = (data ?? []).map((item: any) => {
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
            stock: item.stock !== undefined ? item.stock : 15,
            rooms: [] as string[],
          };
        });
        setProducts(mapped);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadFavorites = async () => {
    const list = await getWishlist();
    setFavorites(list.map(item => item.id));
  };

  const toggleFavorite = async (product: any) => {
    const isFav = favorites.includes(product.id);
    if (isFav) {
      const updated = await removeFromWishlist(product.id);
      setFavorites(updated.map((i: any) => i.id));
    } else {
      const updated = await addToWishlist({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        category: product.category,
      });
      setFavorites(updated.map((i: any) => i.id));
    }
  };

  // Heading
  let title = 'All Products';
  if (filter && SECTION_META[filter]) {
    title = SECTION_META[filter].title;
  } else if (category) {
    title = category.charAt(0).toUpperCase() + category.slice(1);
  } else if (room) {
    title = room + ' Collection';
  }

  // Client-side search & chip filter
  const filtered = products.filter(p => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.price.toLowerCase().includes(q);
      
      if (!matchesSearch) return false;
    }
    
    // Quick chips filter
    if (currentCategory !== 'All') {
      if (p.category.toLowerCase() !== currentCategory.toLowerCase()) return false;
    }
    
    // Room filter
    if (room) {
      const roomKey = room.toLowerCase().trim();
      const mappedCategories = ROOM_CATEGORY_MAP[roomKey];
      
      if (mappedCategories) {
        const allowedCategories = mappedCategories.map(c => c.toLowerCase());
        if (!p.category || !allowedCategories.includes(p.category.toLowerCase())) {
          return false;
        }
        
        // Explicit keyword exclusions to refine room matching
        const pName = p.name.toLowerCase();
        
        if (roomKey === 'office') {
          if (pName.includes('dining') || pName.includes('kitchen') || pName.includes('coffee') || pName.includes('bed') || pName.includes('nightstand')) return false;
        }
        if (roomKey === 'dining room' || roomKey === 'dining') {
          if (pName.includes('office') || pName.includes('desk') || pName.includes('coffee') || pName.includes('bed') || pName.includes('nightstand') || pName.includes('stool') || pName.includes('chair')) return false;
        }
        if (roomKey === 'living room') {
          if (pName.includes('dining') || pName.includes('desk') || pName.includes('office') || pName.includes('bed') || pName.includes('nightstand')) return false;
        }
        if (roomKey === 'bedroom') {
          if (pName.includes('dining') || pName.includes('desk') || pName.includes('office') || pName.includes('coffee') || pName.includes('sofa') || pName.includes('kitchen')) return false;
        }
      }
    }
    
    return true;
  });

  const sortedFiltered = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const getStockRank = (stock: number) => {
        if (stock === 0) return 2;
        if (stock < 10) return 1;
        return 0;
      };
      
      const rankA = getStockRank(a.stock !== undefined ? a.stock : 15);
      const rankB = getStockRank(b.stock !== undefined ? b.stock : 15);
      
      if (rankA !== rankB) {
        return rankB - rankA;
      }
      return 0;
    });
  }, [filtered]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.push('/(tabs)' as any)}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#666" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterIconButton}>
            <Ionicons name="options-outline" size={22} color="#111" />
          </Pressable>
        </View>

        {/* Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {chipOptions.map(chip => {
            const isActive = currentCategory.toLowerCase() === chip.toLowerCase();
            return (
              <Pressable 
                key={chip} 
                onPress={() => router.setParams({ category: chip })} 
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <ThemedText style={[styles.chipText, isActive && styles.chipTextActive]}>{chip}</ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Count */}
      {!loading && (
        <View style={styles.countRow}>
          <ThemedText style={styles.countText}>
            {sortedFiltered.length} item{sortedFiltered.length !== 1 ? 's' : ''}
            {searchQuery.trim() ? ` for "${searchQuery}"` : ''}
          </ThemedText>
        </View>
      )}

      {loading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map(key => (
              <View key={`skeleton-${key}`} style={styles.card}>
                <View style={styles.imageContainer}>
                  <Skeleton width="100%" height="100%" />
                </View>
                <View style={styles.details}>
                  <Skeleton width={60} height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="90%" height={16} style={{ marginBottom: 10 }} />
                  <Skeleton width={80} height={18} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {sortedFiltered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#CCC" />
              <ThemedText style={styles.emptyText}>No products found</ThemedText>
            </View>
          ) : (
            <View style={styles.grid}>
              {sortedFiltered.map(product => (
                <Pressable
                  key={product.id}
                  style={styles.card}
                  onPress={() => router.push(`/product/${product.id}` as any)}
                >
                  <View style={styles.imageContainer}>
                    <Image source={product.image} style={styles.image} resizeMode="cover" />
                    
                    {product.stock === 0 ? (
                      <View style={[styles.tag, { backgroundColor: '#FFE4E6', borderColor: '#FECDD3', borderWidth: 1, borderRadius: 4, top: 8, left: 8 }]}>
                        <ThemedText style={[styles.tagText, { color: '#9F1239', fontWeight: 'bold' }]}>OUT OF STOCK</ThemedText>
                      </View>
                    ) : product.stock < 10 ? (
                      <View style={[styles.tag, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 4, top: 8, left: 8 }]}>
                        <ThemedText style={[styles.tagText, { color: '#92400E', fontWeight: 'bold' }]}>LOW STOCK: {product.stock}</ThemedText>
                      </View>
                    ) : product.onSale ? (
                      <View style={[styles.tag, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 4, top: 8, left: 8 }]}>
                        <ThemedText style={[styles.tagText, { color: '#DC2626', fontWeight: 'bold' }]}>{product.discount || 'SALE'}</ThemedText>
                      </View>
                    ) : product.isBestSeller ? (
                      <View style={[styles.tag, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 4, top: 8, left: 8 }]}>
                        <ThemedText style={[styles.tagText, { color: '#D97706', fontWeight: 'bold' }]}>BEST SELLER</ThemedText>
                      </View>
                    ) : null}

                    <Pressable style={styles.favBtn} onPress={() => toggleFavorite(product)}>
                      <Ionicons
                        name={favorites.includes(product.id) ? 'heart' : 'heart-outline'}
                        size={16}
                        color={favorites.includes(product.id) ? '#E74C3C' : '#666'}
                      />
                    </Pressable>
                  </View>
                  <View style={styles.details}>
                    <ThemedText style={styles.brand}>{product.brand}</ThemedText>
                    <ThemedText style={styles.name} numberOfLines={2}>{product.name}</ThemedText>
                    <View style={styles.priceRow}>
                      {product.onSale ? (
                         <>
                           <ThemedText style={[styles.price, { color: '#DC2626' }]}>{product.salePrice}</ThemedText>
                           <ThemedText style={styles.originalPrice}>{product.price}</ThemedText>
                         </>
                      ) : (
                         <ThemedText style={styles.price}>{product.price}</ThemedText>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <BottomTabBar />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
  },
  searchContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    paddingVertical: 12,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  filterIconButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#111',
    paddingVertical: 10,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#111',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
  },
  countRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  scrollContent: {
    padding: 8,
    paddingBottom: 60,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '49%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#F9F8F6',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  details: {
    padding: 10,
  },
  brand: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: '#111',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  originalPrice: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
