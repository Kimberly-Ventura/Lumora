import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Image, useWindowDimensions, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminTheme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Product3DViewer } from '@/components/Product3DViewer';

const CATEGORIES = ['Chair', 'Table', 'Bed', 'Sofa', 'Desk'];

export default function AdminAddProductScreen() {
  const router = useRouter();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!editId;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [existingModelUrl, setExistingModelUrl] = useState<string | null>(null);
  const [modelFileName, setModelFileName] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [statusText, setStatusText] = useState('');
  const [isActive, setIsActive] = useState(false);

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
          setStock(String(data.stock || '10'));
          setIsActive(data.is_active ?? false);
          setExistingImageUrl(data.image_url || null);
          setExistingModelUrl(data.model_url || null);
          // Match category
          const cat = data.categories?.name;
          if (cat && CATEGORIES.includes(cat)) setCategory(cat);
        }
      } catch (err: any) {
        Alert.alert('Error', 'Failed to load product: ' + err.message);
      } finally {
        setLoadingProduct(false);
      }
    };
    loadProduct();
  }, [editId]);
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

  const pickGlbFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        if (asset.name.toLowerCase().endsWith('.glb')) {
          setModelUri(asset.uri);
          setModelFileName(asset.name);
        } else {
          Alert.alert('Invalid File', 'Please select a valid 3D model file ending in .glb');
        }
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick 3D model file.');
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

  const uploadModelToSupabase = async (uri: string): Promise<string> => {
    setStatusText('Uploading 3D model...');
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `model_${Date.now()}.glb`;

    const { data, error } = await supabase.storage
      .from('models')
      .upload(fileName, blob, { contentType: 'model/gltf-binary' });

    if (error) {
      if (error.message.includes('bucket not found')) {
        await supabase.storage.createBucket('models', { public: true });
        const retry = await supabase.storage.from('models').upload(fileName, blob, { contentType: 'model/gltf-binary' });
        if (retry.error) throw retry.error;
      } else {
        throw error;
      }
    }
    const { data: publicUrlData } = supabase.storage.from('models').getPublicUrl(fileName);
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
      
      // 2. Upload new GLB model if picked, otherwise keep existing
      let finalModelUrl = existingModelUrl;
      if (modelUri) {
        finalModelUrl = await uploadModelToSupabase(modelUri);
      }
      
      setStatusText('Saving product to database...');

      const { data: catData } = await supabase.from('categories').select('id').eq('name', category).single();

      const payload = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        image_url: finalImageUrl,
        model_url: finalModelUrl,
        category_id: catData?.id || null,
        is_active: isActive,
      };

      if (isEditMode) {
        // 3a. Update existing product
        const { error } = await supabase.from('products').update(payload).eq('id', editId);
        if (error) throw error;
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        // 3b. Insert new product
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        Alert.alert('Success', 'Product saved successfully!');
      }

      // Navigate back and refresh products list
      router.back();
      // Force a small delay to ensure navigation completes before refresh
      setTimeout(() => {
        router.push('/(admin)/products');
      }, 100);
      
    } catch (err: any) {
      Alert.alert('Error saving product', err.message);
    } finally {
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainLayout, isDesktop ? styles.row : styles.col]}>
          
          {/* --- LEFT COLUMN --- */}
          <View style={[styles.column, isDesktop && { paddingRight: 12 }]}>
            <Text style={styles.sectionTitle}>Product Image</Text>
            
            <View style={styles.card}>
              <Pressable style={styles.uploadBox} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                ) : existingImageUrl ? (
                  <Image source={{ uri: existingImageUrl }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={48} color={AdminTheme.secondary} />
                    <Text style={styles.uploadText}>Upload Product Image</Text>
                    <Text style={styles.uploadSubtext}>JPG, PNG supported</Text>
                  </View>
                )}
              </Pressable>
              
              {imageUri && (
                <Pressable style={styles.changeImageBtn} onPress={pickImage}>
                  <Text style={styles.changeImageText}>Change Image</Text>
                </Pressable>
              )}

              <View style={styles.formSection}>
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
                    <TextInput
                      style={styles.input}
                      value={stock}
                      onChangeText={setStock}
                      keyboardType="number-pad"
                      placeholder="10"
                      placeholderTextColor={AdminTheme.textMuted}
                    />
                  </View>
                </View>

                <View style={[styles.formGroup, { zIndex: 50, elevation: 50 }]}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.dropdownContainer}>
                    <Pressable 
                      style={styles.dropdownHeader} 
                      onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                      <Text style={styles.dropdownHeaderText}>{category}</Text>
                      <Ionicons name="chevron-down" size={20} color={AdminTheme.primaryDark} />
                    </Pressable>
                    {showCategoryDropdown && (
                      <View style={styles.dropdownList}>
                        {CATEGORIES.map((cat) => (
                          <Pressable 
                            key={cat} 
                            style={styles.dropdownItem}
                            onPress={() => {
                              setCategory(cat);
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{cat}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the product details..."
                    placeholderTextColor={AdminTheme.textMuted}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.toggleContainer}>
                  <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>Publish to Lumora App</Text>
                    <Text style={styles.toggleSublabel}>Make this product visible to customers instantly upon saving</Text>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: '#7A6A5A', true: '#4CAF50' }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* --- RIGHT COLUMN --- */}
          <View style={[styles.column, isDesktop && { paddingLeft: 12 }, !isDesktop && { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>3D Model (Optional)</Text>
            
            <View style={[styles.previewBox]}>
              {modelUri ? (
                <View style={{ flex: 1, width: '100%' }}>
                  <Product3DViewer 
                    modelPath={modelUri}
                    autoRotate={true}
                    enablePan={true}
                    enableZoom={true}
                  />
                </View>
              ) : existingModelUrl ? (
                <View style={{ flex: 1, width: '100%' }}>
                  <Product3DViewer 
                    modelPath={existingModelUrl}
                    autoRotate={true}
                    enablePan={true}
                    enableZoom={true}
                  />
                </View>
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Ionicons name="cube-outline" size={64} color="#555" />
                  <Text style={styles.previewText}>No 3D model yet — you can add one later</Text>
                </View>
              )}
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>

            <View style={styles.uploadBtnContainer}>
              <Pressable style={styles.uploadGlbBtn} onPress={pickGlbFile}>
                <Ionicons name="document-attach-outline" size={20} color={AdminTheme.primaryDark} style={{ marginRight: 6 }} />
                <Text style={styles.uploadGlbText}>
                  {modelUri ? 'Change .glb File' : 'Upload 3D Model (.glb)'}
                </Text>
              </Pressable>
              
              {(modelUri || existingModelUrl) && (
                <Pressable 
                  style={[styles.uploadGlbBtn, { backgroundColor: '#FADBD8', borderColor: '#EC7063', marginLeft: 8, flex: 0.4 }]} 
                  onPress={() => {
                    setModelUri(null);
                    setModelFileName(null);
                    setExistingModelUrl(null);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#C0392B" style={{ marginRight: 6 }} />
                  <Text style={[styles.uploadGlbText, { color: '#C0392B' }]}>Remove</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.supportedFormatsText}>Supported format: .glb</Text>
          </View>
          
        </View>

        {/* --- BOTTOM --- */}
        <View style={styles.bottomSection}>
          <Pressable 
            style={[styles.generateButton, isSubmitting && styles.generateButtonDisabled]} 
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

      </ScrollView>
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
