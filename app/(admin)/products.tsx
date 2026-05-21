import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, Switch, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminTheme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  model_url: string | null;
};

// Helper component to handle image load errors gracefully
const ProductCardImage = ({ uri }: { uri: string | null }) => {
  const [error, setError] = React.useState(false);

  if (!uri || error) {
    return (
      <View style={styles.placeholderImage}>
        <Ionicons name="image-outline" size={24} color={AdminTheme.secondary} />
      </View>
    );
  }

  return (
    <Image 
      source={{ uri }} 
      style={styles.productImage} 
      onError={() => setError(true)} 
    />
  );
};

export default function AdminProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Live' | 'Hidden' | 'No 3D Model'>('All');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleProductActive = async (product: Product) => {
    const newStatus = !product.is_active;
    
    // Optimistically update local state first
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      const message = newStatus ? "Product is now LIVE" : "Product is now HIDDEN";
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Status Updated', message);
      }
    } catch (err: any) {
      console.error('Error toggling product active status:', err);
      // Revert local state on failure
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !newStatus } : p));
      
      const errorMsg = `Failed to update product status: ${err.message}`;
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Live') return p.is_active === true;
    if (activeFilter === 'Hidden') return p.is_active === false;
    if (activeFilter === 'No 3D Model') return p.model_url === null || p.model_url === '';
    return true;
  });

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <ProductCardImage uri={item.image_url} />
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₱{item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        
        <View style={styles.badgeRow}>
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>Stock: {item.stock}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#4CAF50' : '#7A6A5A' }]}>
            <Text style={styles.badgeText}>{item.is_active ? 'LIVE' : 'HIDDEN'}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: item.model_url ? '#C9A96E' : '#EAE4DC' }]}>
            <Text style={[styles.badgeText, { color: item.model_url ? '#FFF' : '#3B2A1A' }]}>
              {item.model_url ? '3D Ready' : 'No 3D'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <Switch
          value={item.is_active}
          onValueChange={() => toggleProductActive(item)}
          trackColor={{ false: '#7A6A5A', true: '#4CAF50' }}
          thumbColor="#FFF"
        />
        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
        >
          <Ionicons name="eye-outline" size={20} color={AdminTheme.primaryDark} />
        </Pressable>
        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push({ pathname: '/(admin)/add-product', params: { editId: item.id } })}
        >
          <Ionicons name="pencil" size={18} color={AdminTheme.primaryDark} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>Manage your inventory and 3D models</Text>
        </View>
        
        <Pressable style={styles.addButton} onPress={() => router.push('/(admin)/add-product')}>
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </Pressable>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {(['All', 'Live', 'Hidden', 'No 3D Model'] as const).map((filterOpt) => {
            const isActive = activeFilter === filterOpt;
            return (
              <Pressable
                key={filterOpt}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setActiveFilter(filterOpt)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
                  {filterOpt}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={AdminTheme.accent} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="cube-outline" size={64} color={AdminTheme.surface} />
          <Text style={styles.emptyText}>No products found.</Text>
          <Text style={styles.emptySubtext}>
            {activeFilter === 'All' 
              ? 'Click "Add Product" to create your first item.' 
              : `No products match the "${activeFilter}" filter.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AdminTheme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AdminTheme.surface,
  },
  title: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 28,
    color: AdminTheme.primaryDark,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: AdminTheme.textMuted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AdminTheme.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontFamily: 'DMSans-Bold',
    color: '#FFF',
    marginLeft: 4,
  },
  filterWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: AdminTheme.surface,
  },
  filterContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: AdminTheme.accent,
  },
  filterChipInactive: {
    backgroundColor: '#EAE4DC',
  },
  filterChipText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  filterChipTextInactive: {
    color: '#7A6A5A',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: AdminTheme.primaryDark,
    marginTop: 16,
  },
  emptySubtext: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: AdminTheme.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: AdminTheme.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: AdminTheme.textPrimary,
  },
  productPrice: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: AdminTheme.primaryDark,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  stockBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: '#137333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: '#FFF',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 6,
  },
  actionButton: {
    padding: 8,
  },
});
