import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Image, useWindowDimensions, Switch, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminTheme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

interface Category {
  id: string;
  name: string;
}

export default function AdminAddProductScreen() {
  const router = useRouter();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!editId;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [onSale, setOnSale] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [statusText, setStatusText] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Reset form when navigating to Add Product page (focused and not in edit mode)
  useFocusEffect(
    React.useCallback(() => {
      if (!isEditMode) {
        setName('');
        setDescription('');
        setPrice('');
        setStock('0');
        setCategory('');
        setIsAddingCategory(false);
        setNewCategoryName('');
        setEditingCategoryId(null);
        setOnSale(false);
        setDiscountPercentage('');
        setIsBestSeller(false);
        setImageUri(null);
        setExistingImageUrl(null);
        setIsActive(false);
      }
    }, [isEditMode])
  );

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (data && !error) setCategoriesList(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Load existing product when in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const loadProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('id', editId)
          .single();
        if (error) throw error;
        if (data) {
          setName(data.name || '');
          setDescription(data.description || '');
          setPrice(String(data.price || ''));
          setStock(String(data.stock || '0'));
          setIsActive(data.is_active ?? false);
          setOnSale(data.on_sale ?? false);
          setDiscountPercentage(data.discount_percentage ? String(data.discount_percentage) : '');
          setIsBestSeller(data.is_best_seller ?? false);
          setExistingImageUrl(data.image_url || null);
          // Match category
          const cat = data.categories?.name;
          if (cat) setCategory(cat);
        }
      } catch (err: any) {
        Alert.alert('Error', 'Failed to load product: ' + err.message);
      } finally {
        setLoadingProduct(false);
      }
    };
    loadProduct();
  }, [editId]);
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]);
      if (error) throw error;
      setNewCategoryName('');
      setIsAddingCategory(false);
      await fetchCategories();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add category: ' + err.message);
    }
  };

  const handleEditCategory = async (id: string) => {
    if (!editCategoryName.trim()) {
      setEditingCategoryId(null);
      return;
    }
    try {
      const { error } = await supabase.from('categories').update({ name: editCategoryName.trim() }).eq('id', id);
      if (error) throw error;
      // If the currently selected category was renamed, update the selection
      const oldCat = categoriesList.find(c => c.id === id);
      if (oldCat && oldCat.name === category) {
        setCategory(editCategoryName.trim());
      }
      setEditingCategoryId(null);
      await fetchCategories();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to rename category: ' + err.message);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageToSupabase = async (uri: string): Promise<string> => {
    setStatusText('Uploading 2D image...');
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `product_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (error) {
      if (error.message.includes('bucket not found')) {
        await supabase.storage.createBucket('images', { public: true });
        const retry = await supabase.storage.from('images').upload(fileName, blob, { contentType: 'image/jpeg' });
        if (retry.error) throw retry.error;
      } else {
        throw error;
      }
    }
    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  const handleSave = async () => {
    if (!name || !price || (!imageUri && !existingImageUrl)) {
      Alert.alert('Error', 'Please provide a name, price, and select an image.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 1. Upload new image if one was picked, otherwise keep existing
      let finalImageUrl = existingImageUrl;
      if (imageUri) {
        finalImageUrl = await uploadImageToSupabase(imageUri);
      }
      
      setStatusText('Saving product to database...');

      const { data: catData } = await supabase.from('categories').select('id').eq('name', category).single();

      const payload = {
        name,
        description,
        price: parseFloat(price.replace(/,/g, '')),
        stock: parseInt(stock || '0', 10),
        image_url: finalImageUrl,
        category_id: catData?.id || null,
        is_active: isActive,
        on_sale: onSale,
        discount_percentage: discountPercentage ? parseFloat(discountPercentage) : 0,
        is_best_seller: isBestSeller, updated_at: new Date().toISOString(),
      };

      console.log('[ADD_PRODUCT_SCREEN SAVE] Attempting to save payload:', payload);

      let savedId: string | undefined = Array.isArray(editId) ? editId[0] : editId;
      console.log('[ADD_PRODUCT_SCREEN SAVE] Mode:', isEditMode ? 'EDIT' : 'CREATE', 'savedId:', savedId);

      if (isEditMode) {
        // 3a. Update existing product — use .select('id') to verify rows were actually updated
        let { data: updatedRows, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', savedId)
          .select('id');
        if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('discount_percentage'))) {
          console.warn('[ADD_PRODUCT_SCREEN SAVE] Primary update failed, attempting fallback payload:', error);
          const fallbackPayload = { ...payload };
          delete (fallbackPayload as any).discount_percentage;
          const retry = await supabase
            .from('products')
            .update(fallbackPayload)
            .eq('id', savedId)
            .select('id');
          updatedRows = retry.data;
          error = retry.error;
        }
        if (error) {
          console.error('[ADD_PRODUCT_SCREEN SAVE ERROR]', error);
          throw error;
        }
        // Verify at least 1 row was updated. If 0 rows affected, the update was silently blocked
        // (e.g. by an RLS policy or a mismatched ID) — treat this as a real failure.
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error('The product could not be updated. It may have been deleted, or you may not have permission to edit it.');
        }
        console.log('[ADD_PRODUCT_SCREEN SAVE] Update completed successfully! Rows affected:', updatedRows.length);
      } else {
        // 3b. Insert new product
        let { data, error } = await supabase.from('products').insert([payload]).select('id').single();
        if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('discount_percentage'))) {
          console.warn('[ADD_PRODUCT_SCREEN SAVE] Primary insert failed, attempting fallback payload:', error);
          const fallbackPayload = { ...payload };
          delete (fallbackPayload as any).discount_percentage;
          const retry = await supabase.from('products').insert([fallbackPayload]).select('id').single();
          data = retry.data;
          error = retry.error;
        }
        if (error) {
          console.error('[ADD_PRODUCT_SCREEN SAVE ERROR]', error);
          throw error;
        }
        if (data) {
          savedId = data.id;
        }
        console.log('[ADD_PRODUCT_SCREEN SAVE] Insert completed successfully! savedId:', savedId);
      }

      // Cache the last edited product id for sorting
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        if (savedId) {
          console.log('[ADD_PRODUCT_SCREEN ASYNCSTORAGE] Writing last_edited_product_id:', savedId);
          await AsyncStorage.setItem('last_edited_product_id', savedId);
        }
      } catch (storageErr) {
        console.warn('[ADD_PRODUCT_SCREEN ASYNCSTORAGE ERROR] Failed to cache last edited ID:', storageErr);
      }
      
      const optimisticProductObj = {
        id: savedId,
        ...payload,
        updated_at: new Date().toISOString(),
      };
      
      // Broadcast the saved product directly to the Products screen
      console.log('[ADD_PRODUCT_SCREEN SAVE] Emitting PRODUCT_SAVED event with optimistic object:', optimisticProductObj);
      DeviceEventEmitter.emit('PRODUCT_SAVED', optimisticProductObj);

      // Navigate back to the products list immediately
      console.log('[ADD_PRODUCT_SCREEN SAVE] Navigating back to products screen');
      router.replace('/(admin)/products');
      
    } catch (err: any) {
      console.error('[ADD_PRODUCT_SCREEN SAVE CATCH ERROR]', err);
      Alert.alert('Error saving product', err.message);
    } finally {
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(admin)/products')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AdminTheme.primaryDark} />
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Product' : 'Back to Products'}
          </Text>
        </Pressable>
      </View>

      {loadingProduct ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AdminTheme.accent} />
        </View>
      ) : (
      <View style={[styles.mainLayout, { flex: 1, padding: 24, flexDirection: isDesktop ? 'row' : 'column', gap: 24 }]}>
        
        {/* --- LEFT SIDE (Image) --- */}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Product Image</Text>
          <View style={[styles.card, { flex: 1, justifyContent: 'center' }]}>
            <Pressable style={[styles.uploadBox, { aspectRatio: undefined, flex: 1, borderWidth: 0 }]} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={[styles.previewImage, { resizeMode: 'contain' }]} />
              ) : existingImageUrl ? (
                <Image source={{ uri: existingImageUrl }} style={[styles.previewImage, { resizeMode: 'contain' }]} />
              ) : (
                <View style={[styles.uploadPlaceholder, { height: '100%', width: '100%', justifyContent: 'center', borderWidth: 2, borderColor: AdminTheme.secondary, borderStyle: 'dashed', borderRadius: 16 }]}>
                  <Ionicons name="cloud-upload-outline" size={48} color={AdminTheme.secondary} />
                  <Text style={styles.uploadText}>Upload Product Image</Text>
                  <Text style={styles.uploadSubtext}>JPG, PNG supported</Text>
                </View>
              )}
            </Pressable>
            {imageUri && (
              <Pressable style={[styles.changeImageBtn, { position: 'absolute', bottom: 20 }]} onPress={pickImage}>
                <Text style={styles.changeImageText}>Change Image</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* --- RIGHT SIDE (Form Inputs) --- */}
        <View style={{ flex: 1.5 }}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={[styles.card, { flex: 1, justifyContent: 'space-between' }]}>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Verona Velvet Sofa"
                placeholderTextColor={AdminTheme.textMuted}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Price</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={AdminTheme.textMuted}
                  />
                </View>
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Stock</Text>
                <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 }]}>
                  <Pressable 
                    onPress={() => setStock(String(Math.max(0, parseInt(stock || '0') - 1)))}
                    style={{ padding: 8, backgroundColor: '#F5F5F5', borderRadius: 6 }}
                  >
                    <Ionicons name="remove" size={16} color={AdminTheme.primaryDark} />
                  </Pressable>
                  <TextInput
                    style={{ flex: 1, textAlign: 'center', fontFamily: 'DMSans-Regular', fontSize: 16, color: AdminTheme.textPrimary }}
                    value={stock}
                    onChangeText={(val) => {
                      const num = parseInt(val);
                      if (isNaN(num)) setStock('');
                      else setStock(String(Math.max(0, num)));
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={AdminTheme.textMuted}
                  />
                  <Pressable 
                    onPress={() => setStock(String(parseInt(stock || '0') + 1))}
                    style={{ padding: 8, backgroundColor: '#F5F5F5', borderRadius: 6 }}
                  >
                    <Ionicons name="add" size={16} color={AdminTheme.primaryDark} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={[styles.formRow, { zIndex: 50, elevation: 50 }]}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Category</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {categoriesList.map((cat) => (
                    <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {editingCategoryId === cat.id ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: AdminTheme.primaryDark, overflow: 'hidden' }}>
                          <TextInput
                            style={{ fontFamily: 'DMSans-Regular', fontSize: 14, color: AdminTheme.textPrimary, paddingVertical: 6, paddingLeft: 12, paddingRight: 6, minWidth: 100, outlineStyle: 'none' as any }}
                            value={editCategoryName}
                            onChangeText={setEditCategoryName}
                            autoFocus
                            autoComplete="off"
                            autoCorrect={false}
                            spellCheck={false}
                            onSubmitEditing={() => handleEditCategory(cat.id)}
                          />
                          <Pressable 
                            onPress={() => handleEditCategory(cat.id)}
                            style={{ padding: 8, backgroundColor: AdminTheme.primaryDark, justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Ionicons name="checkmark" size={16} color="#FFF" />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable 
                          style={{ 
                            paddingVertical: 8, 
                            paddingHorizontal: 14, 
                            backgroundColor: category === cat.name ? AdminTheme.primaryDark : '#FFF', 
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: category === cat.name ? AdminTheme.primaryDark : '#DDD',
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          onPress={() => setCategory(cat.name)}
                        >
                          <Text style={{ 
                            fontFamily: 'DMSans-Regular', 
                            fontSize: 14, 
                            color: category === cat.name ? '#FFF' : AdminTheme.textPrimary,
                            marginRight: 6
                          }}>
                            {cat.name}
                          </Text>
                          <Pressable onPress={(e) => { e.stopPropagation(); setEditingCategoryId(cat.id); setEditCategoryName(cat.name); }}>
                            <Ionicons name="pencil" size={14} color={category === cat.name ? '#FFF' : AdminTheme.textMuted} />
                          </Pressable>
                        </Pressable>
                      )}
                    </View>
                  ))}
                  
                  {isAddingCategory ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: AdminTheme.primaryDark, overflow: 'hidden' }}>
                      <TextInput
                        style={{ fontFamily: 'DMSans-Regular', fontSize: 14, color: AdminTheme.textPrimary, paddingVertical: 6, paddingLeft: 12, paddingRight: 6, minWidth: 100, outlineStyle: 'none' as any }}
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        placeholder="New category..."
                        autoFocus
                        autoComplete="off"
                        autoCorrect={false}
                        spellCheck={false}
                        onSubmitEditing={handleAddCategory}
                      />
                      <Pressable 
                        onPress={() => { if (!newCategoryName) setIsAddingCategory(false); else handleAddCategory(); }}
                        style={{ padding: 8, backgroundColor: AdminTheme.primaryDark, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable 
                      style={{ paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#EAE4DC', borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => setIsAddingCategory(true)}
                    >
                      <Ionicons name="add" size={16} color={AdminTheme.primaryDark} style={{ marginRight: 4 }} />
                      <Text style={{ fontFamily: 'DMSans-Regular', fontSize: 14, color: AdminTheme.primaryDark }}>Add</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {onSale && (
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Discount Percentage</Text>
                  <View style={[styles.priceInputContainer, { width: '100%' }]}>
                    <TextInput
                      style={[styles.priceInput, { color: '#DC2626', fontFamily: 'DMSans-Bold' }]}
                      value={discountPercentage}
                      onChangeText={setDiscountPercentage}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={AdminTheme.textMuted}
                    />
                    <Text style={[styles.currencySymbol, { marginLeft: 4, marginRight: 0 }]}>%</Text>
                  </View>
                  <Text style={{ marginTop: 8, fontFamily: 'DMSans-Bold', color: '#DC2626', fontSize: 15 }}>
                    Sale Price: ₱{(parseFloat((price || '0').replace(/,/g, '')) * (1 - (parseFloat(discountPercentage || '0') / 100))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { height: 60 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the product details..."
                placeholderTextColor={AdminTheme.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={[styles.formRow, { marginBottom: 16 }]}>
              <View style={[styles.toggleContainer, { flex: 1, marginTop: 0, marginRight: 8, padding: 12 }]}>
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleLabel}>On Sale</Text>
                </View>
                <Switch value={onSale} onValueChange={setOnSale} trackColor={{ false: '#7A6A5A', true: '#4CAF50' }} thumbColor="#FFF" />
              </View>
              <View style={[styles.toggleContainer, { flex: 1, marginTop: 0, marginLeft: 8, padding: 12 }]}>
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleLabel}>Best Seller</Text>
                </View>
                <Switch value={isBestSeller} onValueChange={setIsBestSeller} trackColor={{ false: '#7A6A5A', true: '#4CAF50' }} thumbColor="#FFF" />
              </View>
            </View>

            <View style={[styles.toggleContainer, { padding: 12, marginTop: 0, marginBottom: 24 }]}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Publish to Lumora App</Text>
                <Text style={styles.toggleSublabel}>Make this product visible instantly</Text>
              </View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#7A6A5A', true: '#4CAF50' }} thumbColor="#FFF" />
            </View>
            
            <View style={[{ alignItems: 'center' }]}>
              <Pressable 
                style={[styles.generateButton, { paddingVertical: 14, width: '100%', maxWidth: '100%' }, isSubmitting && styles.generateButtonDisabled]} 
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Ionicons name="save-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.generateButtonText}>
                  {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
                </Text>
              </Pressable>
            </View>

          </View>
        </View>

      </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AdminTheme.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: AdminTheme.primaryDark,
    marginLeft: 8,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  mainLayout: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 28,
    color: AdminTheme.primaryDark,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#EAE4DC',
    borderRadius: 16,
    padding: 20,
  },
  uploadBox: {
    width: '100%',
    aspectRatio: 1.5,
    backgroundColor: '#EAE4DC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AdminTheme.secondary,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: AdminTheme.primaryDark,
    marginTop: 12,
  },
  uploadSubtext: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: AdminTheme.secondary,
    marginTop: 4,
  },
  changeImageBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
  },
  changeImageText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: AdminTheme.primaryDark,
  },
  formSection: {
    marginTop: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: AdminTheme.primaryDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: AdminTheme.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: AdminTheme.textPrimary,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: AdminTheme.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownHeader: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownHeaderText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: AdminTheme.textPrimary,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: AdminTheme.textPrimary,
  },
  previewBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1C1410',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 24,
  },
  statusText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: AdminTheme.textPrimary,
    flex: 1,
  },
  uploadBtnContainer: {
    flexDirection: 'row',
    marginTop: 16,
    width: '100%',
  },
  uploadGlbBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE4DC',
    borderWidth: 1,
    borderColor: AdminTheme.primaryDark,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadGlbText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: AdminTheme.primaryDark,
  },
  supportedFormatsText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: AdminTheme.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#C9A96E',
    width: '100%',
    maxWidth: 400,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: '#FFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: AdminTheme.primaryDark,
  },
  toggleSublabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: AdminTheme.textMuted,
    marginTop: 4,
  },
});
