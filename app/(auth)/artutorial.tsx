import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Pressable, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { Product3DViewer } from '@/components/Product3DViewer';

const { width } = Dimensions.get('window');

// Luxury color swatches for real-life transparent customization tutorial
const LUXURY_SWATCHES = [
  { id: 'original', label: 'Original', hex: '#ORIGINAL', uiColor: '#D1C7B7' },
  { id: 'ochre', label: 'Ochre Yellow', hex: '#D09252', uiColor: '#D09252' },
  { id: 'sienna', label: 'Sienna Blue', hex: '#2980b9', uiColor: '#2980b9' },
  { id: 'forest', label: 'Forest Green', hex: '#27ae60', uiColor: '#27ae60' },
  { id: 'charcoal', label: 'Charcoal Black', hex: '#2c3e50', uiColor: '#2c3e50' },
];

export default function ARTutorialScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedColor, setSelectedColor] = useState('#ORIGINAL'); // Active chair customization color
  const [permission, requestPermission] = useCameraPermissions();

  const [hasScanned, setHasScanned] = useState(false);
  const [hasPlaced, setHasPlaced] = useState(false);
  const [hasCustomized, setHasCustomized] = useState(false);

  // Layout animations
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const chairScale = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Track scanning progress simulating surface mapping
  useEffect(() => {
    if (permission?.granted && currentStep === 0) {
      setHasScanned(false);
      // Fade in surface scanning grid slowly
      Animated.timing(gridOpacity, {
        toValue: 0.35,
        duration: 2500,
        useNativeDriver: true,
      }).start(() => {
        setHasScanned(true);
      });
    }
  }, [permission, currentStep]);

  // Pulse animation for placing furniture in Step 2
  useEffect(() => {
    if (currentStep === 1) {
      setHasPlaced(false);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [currentStep]);

  const handlePlaceChair = () => {
    if (hasPlaced) return;
    setHasPlaced(true);
    // Spring pop animation to drop the real-life 3D chair model
    Animated.spring(chairScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleSelectColor = (hex: string) => {
    setSelectedColor(hex);
    setHasCustomized(true);
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  // ── Camera Permission Gating (Luxury Onboarding Dialog) ──
  if (!permission) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#111111' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: '#111111' }]}>
        <View style={styles.permissionWrapper}>
          <View style={styles.permissionHeader}>
            <View style={styles.permissionIconWrapper}>
              <Ionicons name="camera-outline" size={36} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.permissionBrand}>LUMORA STUDIO</ThemedText>
            <ThemedText style={styles.permissionTitle}>Enable Room Camera</ThemedText>
            <ThemedText style={styles.permissionDesc}>
              To place virtual 3D models of premium furniture inside your actual living space, Lumora requires camera access.
            </ThemedText>
          </View>

          <View style={styles.tipsContainer}>
            <View style={styles.tipRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#C9BAA3" style={styles.tipIcon} />
              <View style={styles.tipTextCol}>
                <ThemedText style={styles.tipTitleWhite}>Absolute Privacy</ThemedText>
                <ThemedText style={styles.tipDescWhite}>Your room camera feed is processed in real-time only. We never save, record, or share your video.</ThemedText>
              </View>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="sparkles-outline" size={20} color="#C9BAA3" style={styles.tipIcon} />
              <View style={styles.tipTextCol}>
                <ThemedText style={styles.tipTitleWhite}>Beginner Friendly</ThemedText>
                <ThemedText style={styles.tipDescWhite}>We will guide you step-by-step to scan your floor and drop your first luxury chair.</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.permissionActions}>
            <Pressable onPress={requestPermission} style={styles.permissionBtn}>
              <ThemedText style={styles.permissionBtnText}>Activate Camera</ThemedText>
            </Pressable>
            
            <Pressable onPress={handleSkip} style={styles.permissionSkip}>
              <ThemedText style={styles.permissionSkipText}>Skip & Enter Store</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Render Tutorial Steps overlaid on Camera View ──
  return (
    <View style={styles.container}>
      {/* Active Camera View as Background */}
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
      
      {/* Luxury overlay dark vignette to ensure text contrast */}
      <View style={styles.vignetteOverlay} />

      {/* Render the placed 3D chair model globally over the camera with zero constraints/margins! */}
      {hasPlaced && (currentStep === 1 || currentStep === 2) && (
        <Animated.View style={[styles.live3DViewport, { transform: currentStep === 1 ? [{ scale: chairScale }] : [] }]}>
          <Product3DViewer 
            modelPath="https://hihlihmaeqguhoagnvuu.supabase.co/storage/v1/object/public/models/chair.glb"
            customColor={selectedColor}
            autoRotate={false}
          />
        </Animated.View>
      )}

      {/* Top Header Navigation Row */}
      <View style={styles.navigationHeader}>
        <Pressable onPress={handleSkip} style={styles.skipBtnWrapper}>
          <BlurView intensity={25} tint="light" style={styles.skipBlur}>
            <ThemedText style={[styles.skipText, { color: '#FFFFFF' }]}>Skip Tutorial</ThemedText>
          </BlurView>
        </Pressable>
      </View>

      {/* Step Overlay Cards */}
      <View style={styles.mainContentWrapper}>
        
        {currentStep === 0 && (
          <View style={styles.stepContent}>
            <Animated.View style={[styles.scanGridOverlay, { opacity: gridOpacity }]}>
              {/* Virtual scanning floor grid overlay */}
              {[...Array(9)].map((_, i) => (
                <View key={i} style={styles.gridOverlayLine} />
              ))}
            </Animated.View>

            <View style={styles.instructionCard}>
              <ThemedText style={styles.stepIndicator}>STEP 01 / SCAN</ThemedText>
              <ThemedText style={styles.headline}>Let's find your floor</ThemedText>
              <ThemedText style={styles.description}>
                Slowly move your phone in gentle circles around the room. This helps your camera detect where the floor is so furniture sits perfectly flat.
              </ThemedText>
              
              <View style={[styles.scanningStatus, hasScanned && styles.statusReady]}>
                <Ionicons 
                  name={hasScanned ? "checkmark-circle-outline" : "sync-outline"} 
                  size={16} 
                  color={hasScanned ? "#27ae60" : "#D09252"} 
                />
                <ThemedText style={[styles.statusText, { color: hasScanned ? '#27ae60' : '#D09252' }]}>
                  {hasScanned ? "Floor Detected! Ready." : "Scanning for surfaces..."}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {currentStep === 1 && (
          <View style={styles.stepContent}>
            {/* Active spawn target if not placed */}
            {!hasPlaced && (
              <Pressable onPress={handlePlaceChair} style={styles.placementPulseWrapper}>
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }] }]} />
                <View style={styles.pulseCore} />
                <ThemedText style={styles.placementText}>TAP TO PLACE</ThemedText>
              </Pressable>
            )}

            {!hasPlaced && (
              <View style={styles.instructionCard}>
                <ThemedText style={styles.stepIndicator}>STEP 02 / PLACE</ThemedText>
                <ThemedText style={styles.headline}>Drop your furniture</ThemedText>
                <ThemedText style={styles.description}>
                  A dotted surface mesh has locked onto your floor! Tap the glowing orange target on the screen to place the real-life 3D lounge chair.
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {currentStep === 2 && (
          <View style={[styles.stepContent, { justifyContent: 'center' }]}>
            {/* Floating Swatch Color Bar ONLY */}
            <View style={styles.floatingSwatchContainer}>
              {LUXURY_SWATCHES.map((swatch) => (
                <Pressable 
                  key={swatch.id}
                  onPress={() => handleSelectColor(swatch.hex)}
                  style={[
                    styles.swatchOuterCircle, 
                    { borderColor: selectedColor === swatch.hex ? '#FFFFFF' : 'transparent' }
                  ]}
                >
                  <View style={[styles.swatchInnerCircle, { backgroundColor: swatch.uiColor }]} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

      </View>

      {/* Footer Navigation Overlay */}
      <View style={styles.footer}>
        {/* Progress indicator */}
        <View style={styles.indicatorContainer}>
          {[0, 1, 2].map((step) => (
            <View 
              key={step} 
              style={[
                styles.indicatorBar, 
                { 
                  backgroundColor: step === currentStep ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                  width: step === currentStep ? 24 : 8 
                }
              ]} 
            />
          ))}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.buttonRow}>
          {currentStep > 0 && (
            <Pressable 
              onPress={() => setCurrentStep(prev => prev - 1)} 
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back-outline" size={20} color="#FFFFFF" />
            </Pressable>
          )}

          <Pressable 
            onPress={handleNext} 
            disabled={currentStep === 0 ? !hasScanned : currentStep === 1 ? !hasPlaced : !hasCustomized}
            style={[
              styles.actionBtn, 
              currentStep > 0 ? { flex: 1 } : { width: '100%', maxWidth: 280 },
              { 
                backgroundColor: '#FFFFFF',
                opacity: (currentStep === 0 ? hasScanned : currentStep === 1 ? hasPlaced : hasCustomized) ? 1 : 0.45 
              }
            ]}
          >
            <ThemedText style={styles.actionBtnText}>
              {currentStep === 2 ? 'Enter Studio' : 'Next Step'}
            </ThemedText>
            <Ionicons 
              name={currentStep === 2 ? 'arrow-forward-outline' : 'chevron-forward-outline'} 
              size={16} 
              color="#111111" 
              style={styles.actionBtnIcon} 
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 17, 0.35)',
  },
  navigationHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.m,
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    zIndex: 10,
  },
  skipBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  skipBlur: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  mainContentWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.m,
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 200,
  },
  // Step 1: Scan Grid
  scanGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  gridOverlayLine: {
    width: 1,
    height: '60%',
    backgroundColor: '#FFFFFF',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 1,
  },
  // Step 2: Placement Pulse Target
  placementPulseWrapper: {
    position: 'absolute',
    left: '50%',
    top: '32%',
    marginLeft: -45,
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  pulseRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#D09252',
    opacity: 0.8,
  },
  pulseCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D09252',
    shadowColor: '#D09252',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  placementText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Step 2 & 3: Live 3D Overlay Viewport
  live3DViewport: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  transparentChairContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chairBase: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  chairTintOverlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.38, // Dynamic tint overlay opacity for rich wood-grain show-through
  },
  // Step Cards
  instructionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'center',
    zIndex: 10,
  },
  stepIndicator: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 4,
    color: '#D09252',
    marginBottom: 8,
  },
  headline: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    color: '#111111',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 19,
  },
  scanningStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(208, 146, 82, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusReady: {
    backgroundColor: 'rgba(39, 174, 96, 0.08)',
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  // Swatch color pickers
  swatchContainer: {
    flexDirection: 'row',
    gap: Spacing.s,
    marginTop: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingSwatchContainer: {
    flexDirection: 'row',
    gap: Spacing.s,
    position: 'absolute',
    bottom: 145,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
    zIndex: 20,
  },
  swatchOuterCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  swatchInnerCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  // Camera Permission Layout
  permissionWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingTop: 80,
    paddingBottom: 40,
  },
  permissionHeader: {
    alignItems: 'center',
    gap: 16,
  },
  permissionIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  permissionBrand: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 6,
    opacity: 0.4,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  permissionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#C9BAA3',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    opacity: 0.85,
  },
  tipsContainer: {
    gap: Spacing.m,
    paddingHorizontal: Spacing.s,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginTop: 2,
  },
  tipTextCol: {
    flex: 1,
  },
  tipTitleWhite: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tipDescWhite: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 17,
  },
  permissionActions: {
    gap: Spacing.s,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtn: {
    width: '100%',
    maxWidth: 280,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111111',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  permissionSkip: {
    paddingVertical: 12,
  },
  permissionSkipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#C9BAA3',
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
  // Footer navigation layout
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingBottom: Platform.OS === 'ios' ? 45 : 30,
    gap: Spacing.m,
    zIndex: 10,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorBar: {
    height: 4,
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 320,
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  actionBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#111111',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionBtnIcon: {
    marginLeft: 6,
  },
});
