import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AdminTheme } from '@/constants/theme';

// Interfaces
interface StoreSettings {
  id?: string;
  store_name: string;
  contact_email: string;
  contact_number: string;
  store_address: string;
  flat_rate_shipping: string; // Keep as string for TextInput ease
  free_shipping_threshold: string;
  cod_enabled: boolean;
  gcash_enabled: boolean;
  bank_transfer_enabled: boolean;
  notify_new_order: boolean;
  notify_low_stock: boolean;
  notify_new_customer: boolean;
  auto_lock: boolean;
  auto_lock_minutes: string;
}

const defaultSettings: StoreSettings = {
  store_name: 'Lumora',
  contact_email: '',
  contact_number: '',
  store_address: '',
  flat_rate_shipping: '150',
  free_shipping_threshold: '5000',
  cod_enabled: true,
  gcash_enabled: true,
  bank_transfer_enabled: false,
  notify_new_order: true,
  notify_low_stock: true,
  notify_new_customer: false,
  auto_lock: true,
  auto_lock_minutes: '30',
};

export default function AdminSettingsScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
      if (data && !error) {
        setSettings({
          ...data,
          flat_rate_shipping: String(data.flat_rate_shipping || 0),
          free_shipping_threshold: String(data.free_shipping_threshold || 0),
          auto_lock_minutes: String(data.auto_lock_minutes || 30),
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...settings,
        flat_rate_shipping: Number(settings.flat_rate_shipping) || 0,
        free_shipping_threshold: Number(settings.free_shipping_threshold) || 0,
        auto_lock_minutes: Number(settings.auto_lock_minutes) || 30,
      };

      if (settings.id) {
        await supabase.from('store_settings').update(payload).eq('id', settings.id);
      } else {
        const { data } = await supabase.from('store_settings').insert([payload]).select().single();
        if (data) setSettings({ ...settings, id: data.id });
      }

      if (Platform.OS === 'web') {
        window.alert('Settings saved successfully!');
      } else {
        Alert.alert('Success', 'Settings saved successfully!');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      if (Platform.OS === 'web') window.alert('Failed to save settings.');
      else Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearOrders = () => {
    const confirmMessage = "Are you sure you want to clear ALL orders? This cannot be undone.";
    
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        clearOrders();
      }
    } else {
      Alert.alert('Danger Zone', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearOrders },
      ]);
    }
  };

  const clearOrders = async () => {
    try {
      // Due to RLS or constraints, we just call delete. Since there's no FK constraint, we should delete both independently.
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (Platform.OS === 'web') window.alert('All orders have been cleared.');
      else Alert.alert('Success', 'All orders have been cleared.');
    } catch (err) {
      console.error('Error clearing orders', err);
    }
  };

  const CustomToggle = ({ value, onValueChange }: { value: boolean, onValueChange: (v: boolean) => void }) => (
    <Pressable 
      onPress={() => onValueChange(!value)}
      style={[styles.toggleContainer, value && styles.toggleContainerActive]}
    >
      <View style={[styles.toggleDot, value && styles.toggleDotActive]} />
    </Pressable>
  );

  const updateSetting = (key: keyof StoreSettings, val: any) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color={AdminTheme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Mobile Header */}
      {isMobile && (
        <View style={styles.mobileHeader}>
          <Text style={styles.mobileHeaderTitle}>Settings</Text>
          <Text style={styles.mobileHeaderSubtitle}>Store configuration</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}>
        
        {/* Desktop Header */}
        {!isMobile && (
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Settings</Text>
            <Text style={styles.pageSubtitle}>Manage your store configuration and preferences</Text>
          </View>
        )}

        <View style={[styles.grid, isMobile && styles.gridMobile]}>
          
          {/* 1. Store Info */}
          <View style={[styles.card, isMobile && styles.cardMobile]}>
            <Text style={styles.sectionTitle}>STORE INFO</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store name</Text>
              <TextInput 
                style={styles.input} 
                value={settings.store_name} 
                onChangeText={(v) => updateSetting('store_name', v)} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact email</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="email-address"
                autoCapitalize="none"
                value={settings.contact_email} 
                onChangeText={(v) => updateSetting('contact_email', v)} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact number</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="phone-pad"
                value={settings.contact_number} 
                onChangeText={(v) => updateSetting('contact_number', v)} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store address</Text>
              <TextInput 
                style={styles.input} 
                value={settings.store_address} 
                onChangeText={(v) => updateSetting('store_address', v)} 
              />
            </View>
          </View>

          {/* 2. Shipping & Payments */}
          <View style={[styles.card, isMobile && styles.cardMobile]}>
            <Text style={styles.sectionTitle}>SHIPPING & PAYMENTS</Text>
            
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Flat rate shipping</Text>
              <View style={styles.currencyInputWrapper}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput 
                  style={[styles.input, styles.currencyInput]} 
                  keyboardType="numeric"
                  value={settings.flat_rate_shipping} 
                  onChangeText={(v) => updateSetting('flat_rate_shipping', v)} 
                />
              </View>
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Free shipping threshold</Text>
              <View style={styles.currencyInputWrapper}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput 
                  style={[styles.input, styles.currencyInput]} 
                  keyboardType="numeric"
                  value={settings.free_shipping_threshold} 
                  onChangeText={(v) => updateSetting('free_shipping_threshold', v)} 
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Cash on delivery</Text>
              <CustomToggle value={settings.cod_enabled} onValueChange={(v) => updateSetting('cod_enabled', v)} />
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>GCash</Text>
              <CustomToggle value={settings.gcash_enabled} onValueChange={(v) => updateSetting('gcash_enabled', v)} />
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Bank transfer</Text>
              <CustomToggle value={settings.bank_transfer_enabled} onValueChange={(v) => updateSetting('bank_transfer_enabled', v)} />
            </View>
          </View>

          {/* 3. Security */}
          <View style={[styles.card, isMobile && styles.cardMobile]}>
            <Text style={styles.sectionTitle}>SECURITY</Text>

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Session auto lock</Text>
              <CustomToggle value={settings.auto_lock} onValueChange={(v) => updateSetting('auto_lock', v)} />
            </View>

            {settings.auto_lock && (
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Lock after (minutes)</Text>
                <TextInput
                  style={[styles.input, { width: 80, textAlign: 'right' }]}
                  keyboardType="numeric"
                  value={settings.auto_lock_minutes}
                  onChangeText={(v) => updateSetting('auto_lock_minutes', v)}
                />
              </View>
            )}
          </View>

          {/* 4. Notifications & Danger Zone */}
          <View style={[styles.card, isMobile && styles.cardMobile]}>
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
            
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>New order alert</Text>
              <CustomToggle value={settings.notify_new_order} onValueChange={(v) => updateSetting('notify_new_order', v)} />
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Low stock alert</Text>
              <CustomToggle value={settings.notify_low_stock} onValueChange={(v) => updateSetting('notify_low_stock', v)} />
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Customer signup</Text>
              <CustomToggle value={settings.notify_new_customer} onValueChange={(v) => updateSetting('notify_new_customer', v)} />
            </View>

            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>DANGER ZONE</Text>
            <View style={{ alignItems: 'flex-start' }}>
              <Pressable style={styles.dangerBtn} onPress={handleClearOrders}>
                <Text style={styles.dangerBtnText}>Clear all orders</Text>
              </Pressable>
            </View>
          </View>

        </View>

        {/* Save Button */}
        <View style={styles.footer}>
          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#111" /> : <Text style={styles.saveBtnText}>Save settings</Text>}
          </Pressable>
          <Text style={styles.versionText}>Lumora Admin v1.0 · Built with Expo + Supabase</Text>
        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  centerAll: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 40,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
    paddingBottom: 80,
  },
  scrollContentMobile: {
    padding: 16,
    paddingBottom: 80,
  },
  mobileHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AdminTheme.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mobileHeaderTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 24,
    color: AdminTheme.accent,
  },
  mobileHeaderSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 32,
    color: AdminTheme.primaryDark,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: AdminTheme.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 40,
  },
  gridMobile: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    width: '48%',
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    padding: 24,
  },
  cardMobile: {
    width: '100%',
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: AdminTheme.textMuted,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: AdminTheme.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#EDE8DF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: AdminTheme.primaryDark,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: AdminTheme.primaryDark,
  },
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: AdminTheme.textMuted,
    marginRight: 8,
  },
  currencyInput: {
    width: 100,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(43,31,20,0.06)',
    marginVertical: 12,
  },
  
  // Custom Toggle
  toggleContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDE8DF',
    borderWidth: 1,
    borderColor: 'rgba(43,31,20,0.12)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleContainerActive: {
    backgroundColor: AdminTheme.accent,
    borderColor: AdminTheme.accent,
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },

  dangerBtn: {
    borderWidth: 1,
    borderColor: '#B71C1C',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dangerBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#B71C1C',
  },

  // Footer
  footer: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  saveBtn: {
    backgroundColor: AdminTheme.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111',
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: AdminTheme.textMuted,
  },
});
