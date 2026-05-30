import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, Switch, Modal, ScrollView, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminTheme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useNotification } from '@/context/NotificationContext';
import { Skeleton } from '@/components/Skeleton';

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  model_url: string | null;
  updated_at?: string;
  created_at?: string;
  on_sale?: boolean;
  discount_percentage?: number;
  is_best_seller?: boolean;
  is_archived?: boolean;
  category_id?: string | null;
  categories?: { name: string } | null;
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
      resizeMode="cover"
    />
  );
};

const ProductPreviewModal = ({ 
  visible, 
  onClose, 
  product, 
  onToggleActive 
}: { 
  visible: boolean, 
  onClose: () => void, 
  product: Product | null, 
  onToggleActive: (p: Product) => void 
}) => {
  if (!product) return null;
  const router = useRouter();
  
  const originalPrice = product.price;
  const salePrice = product.on_sale && product.discount_percentage ? originalPrice * (1 - product.discount_percentage / 100) : originalPrice;
  const categoryName = Array.isArray(product.categories) ? product.categories[0]?.name : (product.categories as any)?.name || 'Furniture';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.previewOverlay} onPress={onClose}>
        <Pressable style={styles.previewContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewHeaderTitle}>Product Preview</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.toggleWrapper}>
                <Text style={[styles.statusLabel, { color: product.is_active ? '#4CAF50' : '#7A6A5A' }]}>
                  {product.is_active ? 'Live' : 'Hidden'}
                </Text>
                <Switch
                  value={product.is_active}
                  onValueChange={() => onToggleActive(product)}
                  trackColor={{ false: '#7A6A5A', true: '#4CAF50' }}
                  thumbColor="#FFF"
                />
              </View>
              <Pressable 
                style={styles.previewEditBtn}
                onPress={() => {
                  onClose();
                  router.push({ pathname: '/(admin)/add-product', params: { id: product.id } } as any);
                }}
              >
                <Text style={styles.previewEditBtnText}>Edit</Text>
              </Pressable>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#111" />
              </Pressable>
            </View>
          </View>
          
          <ScrollView style={styles.previewScroll} contentContainerStyle={{ padding: 20 }}>
            <View style={styles.previewImageContainer}>
               <ProductCardImage uri={product.image_url} />
            </View>
            
            <View style={styles.previewDetails}>
               <Text style={styles.previewCategory}>{categoryName.toUpperCase()}</Text>
               <Text style={styles.previewName}>{product.name}</Text>
               
               <View style={styles.previewPriceRow}>
                 {product.on_sale && product.discount_percentage && product.discount_percentage > 0 ? (
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                     <Text style={styles.previewPriceOriginal}>
                       ₱{originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                     </Text>
                     <Text style={styles.previewPriceSale}>
                       ₱{salePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                     </Text>
                   </View>
                 ) : (
                   <Text style={styles.previewPrice}>
                     ₱{originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                   </Text>
                 )}
               </View>
               
               <View style={styles.previewBadgeRow}>
                 {product.on_sale && product.discount_percentage && product.discount_percentage > 0 ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.badgeText, { color: '#DC2626' }]}>{`${product.discount_percentage}% OFF`}</Text>
                    </View>
                 ) : null}
                 {product.is_best_seller && (
                   <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                     <Text style={[styles.badgeText, { color: '#D97706' }]}>Best Seller</Text>
                   </View>
                 )}
                 <View style={[
                     styles.stockBadge, 
                     product.stock === 0 ? { backgroundColor: '#FFE4E6', borderColor: '#FECDD3', borderWidth: 1 } : 
                     product.stock < 10 ? { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 } : 
                     { backgroundColor: '#E6F4EA', borderWidth: 0 }
                   ]}>
                    <Text style={[
                       styles.stockText,
                       product.stock === 0 ? { color: '#9F1239', fontWeight: 'bold' } : 
                       product.stock < 10 ? { color: '#92400E', fontWeight: 'bold' } : 
                       { color: '#137333' }
                     ]}>
                      {product.stock === 0 ? 'OUT OF STOCK' : product.stock < 10 ? `LOW STOCK: ${product.stock}` : `Stock: ${product.stock}`}
                    </Text>
                  </View>
               </View>
               
               <View style={styles.previewDivider} />
               
               <Text style={styles.previewSectionTitle}>Description</Text>
               <Text style={styles.previewDescription}>{product.description || 'No description available.'}</Text>
               
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function AdminProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Live' | 'Hidden' | 'Archived'>('All');
  const [lastEditedId, setLastEditedId] = useState<string | null>(null);
  const { addToast } = useNotification();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [productToPreview, setProductToPreview] = useState<Product | null>(null);

  const latestFetchId = useRef(0);
  const protectedProductRef = useRef<Product | null>(null);
  const justSaved = useRef(false);

  // fetchProducts fetches from DB and ensures the optimistic product isn't overwritten
  const fetchProducts = async (showSpinner = false) => {
    const currentFetchId = ++latestFetchId.current;
    console.log(`[FETCH PRODUCTS START] showSpinner: ${showSpinner}, currentFetchId: ${currentFetchId}`);
    
    try {
      if (showSpinner) setLoading(true);

      let { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('updated_at', { ascending: false });

      // Self-healing fallback: if updated_at column doesn't exist yet, fall back to created_at
      if (error && (error.code === '42703' || error.message?.includes('updated_at'))) {
        console.warn('[FETCH PRODUCTS] updated_at column missing, falling back to created_at');
        const fallback = await supabase
          .from('products')
          .select('*, categories(name)')
          .order('created_at', { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

      // If a newer fetch started while this one was running, discard these stale results
      if (currentFetchId !== latestFetchId.current) {
        console.log(`[FETCH PRODUCTS DISCARD] Discarding stale fetch ${currentFetchId} (latest is ${latestFetchId.current})`);
        return;
      }

      if (error) {
        console.error('[FETCH PRODUCTS ERROR]:', error);
      } else {
        let result: Product[] = data || [];
        console.log(`[FETCH PRODUCTS DB RESULTS] Fetched ${result.length} products from Supabase`);

        // Apply protected optimistic product if we just saved within the last 3 seconds
        const protectedProd = protectedProductRef.current;
        if (protectedProd) {
          console.log('[FETCH PRODUCTS OPTIMISTIC] Applying protected optimistic product:', protectedProd.id, protectedProd.name);
          const exists = result.some(p => p.id === protectedProd.id);
          if (exists) {
            result = result.map(p => p.id === protectedProd.id ? { ...p, ...protectedProd } : p);
          } else {
            result = [protectedProd, ...result];
          }
        }

        // Read lastEditedId from storage
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const cachedId = await AsyncStorage.getItem('last_edited_product_id');
          console.log('[FETCH PRODUCTS ASYNCSTORAGE] Read last_edited_product_id:', cachedId);
          if (cachedId) { setLastEditedId(cachedId); }
        } catch (storageErr) {
          console.warn('[FETCH PRODUCTS ASYNCSTORAGE ERROR] Error reading last_edited_product_id from storage:', storageErr);
        }

        // Add an extra check here because the await AsyncStorage.getItem might have taken time,
        // allowing a newer fetch to start and complete. If so, discard this older fetch's results.
        if (currentFetchId !== latestFetchId.current) {
          console.log(`[FETCH PRODUCTS DISCARD LATE] Discarding stale fetch ${currentFetchId} (latest is ${latestFetchId.current})`);
          return;
        }

        setProducts(result);
      }
    } finally {
      if (showSpinner && currentFetchId === latestFetchId.current) setLoading(false);
    }
  };

  // Listen for the immediate, synchronous event emitted when a product is saved
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('PRODUCT_SAVED', (parsed: Product) => {
      console.log('[DEVICE EMITTER PRODUCT_SAVED TRIGGERED] ID:', parsed.id, 'Name:', parsed.name, parsed);
      justSaved.current = true;
      setLastEditedId(parsed.id);
      setActiveFilter('All'); // Default filter to "All" when saved/updated
      
      // Protect this product for 10 seconds against stale DB reads (e.g. from background polling or delayed realtime events)
      protectedProductRef.current = parsed;
      setTimeout(() => {
        if (protectedProductRef.current?.id === parsed.id) {
          console.log('[OPTIMISTIC PROTECT EXPIRED] Cleared protection for ID:', parsed.id);
          protectedProductRef.current = null;
        }
      }, 10000);

      // Instantly inject into UI state
      setProducts(prev => {
        const exists = prev.some(p => p.id === parsed.id);
        console.log(`[PRODUCT_SAVED STATE INJECTION] Product exists in state? ${exists}`);
        if (exists) return prev.map(p => p.id === parsed.id ? { ...p, ...parsed } : p);
        return [parsed, ...prev];
      });
      
      addToast({ type: 'success', title: 'Product Saved', message: `"${parsed.name}" has been saved successfully.` });
    });

    return () => subscription.remove();
  }, []);

  // Set up real-time subscription for product changes, with a 5s polling fallback
  useEffect(() => {
    fetchProducts(false);

    console.log('[SUPABASE REALTIME INIT] Creating products subscription channel...');
    const channel = supabase
      .channel(`products-changes-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[SUPABASE REALTIME EVENT RECEIVED]', payload.eventType, 'New Row:', payload.new, 'Old Row:', payload.old);
          fetchProducts(false);
        }
      )
      .subscribe((status) => {
        console.log('[SUPABASE REALTIME CHANNEL STATUS]', status);
      });

    const interval = setInterval(() => {
      console.log('[POLLING BACKUP SYNC] Fetching products on interval');
      fetchProducts(false);
    }, 5000);

    return () => {
      console.log('[REALTIME & POLLING CLEANUP]');
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (justSaved.current) {
        // We just arrived from a save, state is already updated. Silent background sync only.
        justSaved.current = false;
        setActiveFilter('All'); // Default filter to "All" upon returning from save
        fetchProducts(false);
      } else {
        // Normal navigation, fetch with spinner
        fetchProducts(true);
      }
    }, [])
  );

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

      // Cache the last edited product ID
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('last_edited_product_id', product.id);
        setLastEditedId(product.id);
      } catch (storageErr) {
        console.warn('Failed to cache last edited ID on toggle:', storageErr);
      }

      const message = newStatus ? "Product is now LIVE" : "Product is now HIDDEN";
      addToast({ type: 'success', title: 'Status Updated', message });
    } catch (err: any) {
      console.error('Error toggling product active status:', err);
      // Revert local state on failure
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !newStatus } : p));
      addToast({ type: 'error', title: 'Error', message: `Failed to update product status: ${err.message}` });
    }
  };

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalVisible(true);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    try {
      // Attempt soft-delete (archive)
      const { error } = await supabase
        .from('products')
        .update({ is_archived: true, is_active: false })
        .eq('id', productToDelete.id);
        
      if (error && (error.code === '42703' || error.code === 'PGRST204')) {
        // Fallback: Alert user that migration is missing instead of hard deleting
        addToast({ type: 'error', title: 'Migration Required', message: `Archiving failed. Please run the database migration to add the is_archived column.` });
        return;
      } else if (error) {
        throw error;
      } else {
        setProducts(prev => prev.map(p => p.id === productToDelete?.id ? { ...p, is_archived: true, is_active: false } : p));
        addToast({ type: 'success', title: 'Archived', message: `Product "${productToDelete.name}" was moved to the archive.` });
      }
      
      // If we archived/deleted the last edited product, we should clear it
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const currentLastEdited = await AsyncStorage.getItem('last_edited_product_id');
        if (currentLastEdited === productToDelete.id) {
          await AsyncStorage.removeItem('last_edited_product_id');
          setLastEditedId(null);
        }
      } catch (storageErr) {
        console.warn('Error clearing last_edited_product_id from storage:', storageErr);
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      addToast({ type: 'error', title: 'Error', message: `Failed to archive product: ${err.message}` });
    } finally {
      setDeleteModalVisible(false);
      setProductToDelete(null);
    }
  };

  const executeRestore = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: false, is_active: false })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_archived: false, is_active: false } : p));
      addToast({ type: 'success', title: 'Restored', message: `Product "${product.name}" was restored to Hidden state.` });
    } catch (err: any) {
      console.error('Error restoring product:', err);
      addToast({ type: 'error', title: 'Error', message: `Failed to restore product: ${err.message}` });
    }
  };

  const filteredProducts = products.filter(p => {
    // Safely parse is_archived to handle string "true" or boolean true
    const isArchived = p.is_archived === true || (p.is_archived as any) === 'true' || (p.is_archived as any) === 1;
    
    if (p.id === lastEditedId) {
      console.log(`[FILTERING STEP] Checking lastEditedId "${p.name}":`, {
        isArchived,
        is_active: p.is_active,
        activeFilter,
        stock: p.stock
      });
    }

    if (activeFilter === 'Archived') return isArchived;
    if (isArchived) return false; // Hide archived products from all other views
    
    const isActive = p.is_active === true || (p.is_active as any) === 'true' || (p.is_active as any) === 1;
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Live') return isActive;
    if (activeFilter === 'Hidden') return !isActive;
    return false;
  });

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <ProductCardImage uri={item.image_url} />
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        {item.on_sale && item.discount_percentage && item.discount_percentage > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
            <Text style={[styles.productPrice, { textDecorationLine: 'line-through', color: AdminTheme.textMuted, fontSize: 12, marginTop: 0 }]}>
              ₱{item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.productPrice, { color: '#DC2626', marginTop: 0, fontFamily: 'DMSans-Bold' }]}>
              ₱{(item.price * (1 - item.discount_percentage / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ) : (
          <Text style={styles.productPrice}>₱{item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        )}
        
        <View style={styles.badgeRow}>
          <View style={[
            styles.stockBadge, 
            item.stock === 0 ? { backgroundColor: '#FFE4E6', borderColor: '#FECDD3', borderWidth: 1 } : 
            item.stock < 10 ? { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 } : 
            { backgroundColor: '#E6F4EA', borderWidth: 0 }
          ]}>
            <Text style={[
              styles.stockText,
              item.stock === 0 ? { color: '#9F1239', fontWeight: 'bold' } : 
              item.stock < 10 ? { color: '#92400E', fontWeight: 'bold' } : 
              { color: '#137333' }
            ]}>
              {item.stock === 0 ? 'OUT OF STOCK' : item.stock < 10 ? `LOW STOCK: ${item.stock}` : `Stock: ${item.stock}`}
            </Text>
          </View>
          


          {item.on_sale && item.discount_percentage && item.discount_percentage > 0 && (
            <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.badgeText, { color: '#DC2626' }]}>{`${item.discount_percentage}% OFF`}</Text>
            </View>
          )}

          {item.is_best_seller && (
            <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.badgeText, { color: '#D97706' }]}>Best Seller</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        {item.is_archived ? (
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#E6F4EA', paddingHorizontal: 16 }]}
            onPress={() => executeRestore(item)}
          >
            <Ionicons name="refresh-outline" size={18} color="#137333" />
            <Text style={{ fontFamily: 'DMSans-Bold', fontSize: 12, color: '#137333', marginLeft: 6 }}>Restore</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.toggleWrapper}>
              <Text style={[styles.statusLabel, { color: item.is_active ? '#4CAF50' : '#7A6A5A' }]}>
                {item.is_active ? 'Live' : 'Hidden'}
              </Text>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleProductActive(item)}
                trackColor={{ false: '#7A6A5A', true: '#4CAF50' }}
                thumbColor="#FFF"
              />
            </View>
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setProductToPreview(item);
                setPreviewModalVisible(true);
              }}
            >
              <Ionicons name="eye-outline" size={18} color={AdminTheme.primaryDark} />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push({ pathname: '/(admin)/add-product', params: { id: item.id } } as any)}
            >
              <Ionicons name="pencil" size={18} color={AdminTheme.primaryDark} />
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
              onPress={() => confirmDelete(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );

  const sortedAndFilteredProducts = React.useMemo(() => {
    // Return a new sorted array to prevent in-place mutation of state
    return [...filteredProducts].sort((a, b) => {
      // 1. lastEditedId priority (stays at the top)
      if (lastEditedId) {
        if (a.id === lastEditedId && b.id !== lastEditedId) return -1;
        if (b.id === lastEditedId && a.id !== lastEditedId) return 1;
      }

      // 2. Stock priority (Out of stock -> Low stock -> Normal)
      const getStockRank = (stock: number) => {
        if (stock === 0) return 2;
        if (stock < 10) return 1;
        return 0;
      };
      
      const rankA = getStockRank(a.stock);
      const rankB = getStockRank(b.stock);
      
      if (rankA !== rankB) {
        return rankB - rankA; // Higher rank (Out of stock) comes first
      }

      // 3. updated_at descending comparison
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);

      if (dateA !== dateB) {
        return dateB - dateA; // Descending order (newest first)
      }

      // 4. Stable fallback using ID
      return a.id.localeCompare(b.id);
    });
  }, [filteredProducts, lastEditedId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>Manage your inventory</Text>
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
          {(['All', 'Live', 'Hidden', 'Archived'] as const).map((filterOpt) => {
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContainer}>
          {[1, 2, 3, 4, 5].map(key => (
            <View key={`product-skeleton-${key}`} style={styles.productCard}>
              <View style={styles.imageContainer}>
                <Skeleton width={60} height={60} borderRadius={8} />
              </View>
              <View style={styles.productInfo}>
                <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
                <Skeleton width="30%" height={14} style={{ marginBottom: 8 }} />
                <View style={styles.badgeRow}>
                  <Skeleton width={60} height={20} borderRadius={4} />
                  <Skeleton width={60} height={20} borderRadius={4} style={{ marginLeft: 6 }} />
                </View>
              </View>
              <View style={styles.actionContainer}>
                <Skeleton width={100} height={36} borderRadius={8} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : sortedAndFilteredProducts.length === 0 ? (
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
          data={sortedAndFilteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={32} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Archive Product?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to archive "{productToDelete?.name}"? It will be hidden from the customer app but can be restored later.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnDelete]}
                onPress={executeDelete}
              >
                <Text style={styles.modalBtnDeleteText}>Archive</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ProductPreviewModal 
        visible={previewModalVisible} 
        onClose={() => setPreviewModalVisible(false)} 
        product={productToPreview} 
        onToggleActive={toggleProductActive}
      />
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
    gap: 8,
    marginLeft: 8,
  },
  toggleWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(43,31,20,0.06)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 24,
    color: AdminTheme.primaryDark,
    marginBottom: 8,
  },
  modalMessage: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: AdminTheme.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#EAE4DC',
  },
  modalBtnCancelText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: AdminTheme.primaryDark,
  },
  modalBtnDelete: {
    backgroundColor: '#DC2626',
  },
  modalBtnDeleteText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#FFF',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FAFAFA',
  },
  previewHeaderTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#111',
  },
  previewEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111',
    borderRadius: 6,
  },
  previewEditBtnText: {
    color: '#FFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  previewScroll: {
    flexShrink: 1,
  },
  previewImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewDetails: {
    paddingHorizontal: 4,
  },
  previewCategory: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#A06E50',
    letterSpacing: 2,
    marginBottom: 6,
  },
  previewName: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
    marginBottom: 12,
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewPrice: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  previewPriceOriginal: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textDecorationLine: 'line-through',
  },
  previewPriceSale: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
  },
  previewBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#EEE',
    width: '100%',
    marginBottom: 24,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#111',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 22,
    paddingBottom: 20,
  }
});
