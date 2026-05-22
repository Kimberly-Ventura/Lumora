import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/wishlistHelper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

export default function ProductListScreen() {
  const router = useRouter();
  const { filter, category, room, search } = useLocalSearchParams<{ filter?: string; category?: string; room?: string; search?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [searchQuery, setSearchQuery] = useState(search || '');
  const [activeChip, setActiveChip] = useState('All');
  const chipOptions = ['All', 'Chair', 'Table', 'Sofa', 'Lamp', 'Bed'];
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)          // only live products
        .order('created_at', { ascending: false });

      // Server-side category filter
      if (category && category.toLowerCase() !== 'new arrival') {
        query = query.ilike('categories.name', category);
      }

      const { data, error } = await query;
      if (error) {
        console.error('product-list fetch error:', error.message);
        setProducts([]);
      } else {
        const mapped = (data ?? []).map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.categories?.name || 'Lumora Design',
          price: `₱${parseFloat(item.price).toLocaleString('en-US')}`,
          image: item.image_url ? { uri: item.image_url } : require('@/assets/images/armchair_clean.png'),
          category: item.categories?.name || '',
          tag: '',          // DB products don't have tags yet
          discount: null,
          originalPrice: null,
          rooms: [] as string[],
        }));
        setProducts(mapped);
      }
    } finally {
      setLoading(false);
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
    if (activeChip !== 'All') {
      if (p.category.toLowerCase() !== activeChip.toLowerCase()) return false;
    }
    
    return true;
  });

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
            const isActive = activeChip === chip;
            return (
              <Pressable 
                key={chip} 
                onPress={() => setActiveChip(chip)} 
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
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            {searchQuery.trim() ? ` for "${searchQuery}"` : ''}
          </ThemedText>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#A06E50" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#CCC" />
              <ThemedText style={styles.emptyText}>No products found</ThemedText>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map(product => (
                <Pressable
                  key={product.id}
                  style={styles.card}
                  onPress={() => router.push(`/product/${product.id}` as any)}
                >
                  <View style={styles.imageContainer}>
                    <Image source={product.image} style={styles.image} resizeMode="cover" />
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
                      <ThemedText style={styles.price}>{product.price}</ThemedText>
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
