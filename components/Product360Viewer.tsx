import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  Extrapolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const VIEWER_SIZE = Math.min(width * 0.9, 420);

interface Product360ViewerProps {
  imageUri: any;
}

export const Product360Viewer: React.FC<Product360ViewerProps> = ({ imageUri }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Rotation angle in degrees (−180 to 180)
  const rotationY = useSharedValue(0);
  const isUserDragging = useSharedValue(false);
  const scale = useSharedValue(1);
  // Track cumulative rotation so auto-rotate resumes from where user left off
  const baseRotation = useSharedValue(0);

  // Auto-rotate when not being dragged
  useEffect(() => {
    rotationY.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1, // infinite
      false
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isUserDragging.value = true;
      cancelAnimation(rotationY);
      baseRotation.value = rotationY.value;
      scale.value = withSpring(1.03);
    })
    .onUpdate((event) => {
      // Map drag distance to rotation degrees
      rotationY.value = baseRotation.value + event.translationX * 0.5;
    })
    .onEnd((event) => {
      scale.value = withSpring(1);
      isUserDragging.value = false;
      // Resume auto-rotate from current position
      const current = rotationY.value % 360;
      rotationY.value = current;
      rotationY.value = withRepeat(
        withTiming(current + 360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
    });

  // The 3D perspective illusion on the image
  const chairStyle = useAnimatedStyle(() => {
    // Normalize rotation to 0–360
    const angle = ((rotationY.value % 360) + 360) % 360;

    // squishX: cos(angle) → 1 at front/back, 0 at sides
    const angleRad = (angle * Math.PI) / 180;
    const cosValue = Math.cos(angleRad);

    // scaleX creates the "side-on" squish effect
    const scaleX = Math.abs(cosValue) * 0.4 + 0.6; // range 0.6–1.0

    return {
      transform: [
        { scaleX },
        { scale: scale.value },
      ],
    };
  });

  // Lighting overlay: dark on left or right depending on angle
  const leftShadeStyle = useAnimatedStyle(() => {
    const angle = ((rotationY.value % 360) + 360) % 360;
    const angleRad = (angle * Math.PI) / 180;
    const sinValue = Math.sin(angleRad);
    // left shade appears when rotating to show left face
    const opacity = Math.max(0, sinValue) * 0.45;
    return { opacity };
  });

  const rightShadeStyle = useAnimatedStyle(() => {
    const angle = ((rotationY.value % 360) + 360) % 360;
    const angleRad = (angle * Math.PI) / 180;
    const sinValue = Math.sin(angleRad);
    // right shade appears when rotating to show right face
    const opacity = Math.max(0, -sinValue) * 0.45;
    return { opacity };
  });

  // Ground shadow shrinks and shifts as chair "turns"
  const shadowStyle = useAnimatedStyle(() => {
    const angle = ((rotationY.value % 360) + 360) % 360;
    const angleRad = (angle * Math.PI) / 180;
    const cosValue = Math.abs(Math.cos(angleRad));
    return {
      opacity: 0.12,
      transform: [
        { scaleX: cosValue * 0.5 + 0.5 },
      ],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.viewerBox, { transform: [{ scale: scale.value }] }]}>
          {/* Chair image with perspective squish */}
          <Animated.View style={[styles.imageWrapper, chairStyle]}>
            <Image
              source={imageUri}
              style={styles.image}
              contentFit="contain"
            />

            {/* Left shading overlay */}
            <Animated.View style={[StyleSheet.absoluteFill, leftShadeStyle, styles.shade]}>
              <LinearGradient
                colors={['rgba(0,0,0,0.55)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Right shading overlay */}
            <Animated.View style={[StyleSheet.absoluteFill, rightShadeStyle, styles.shade]}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Animated.View>

          {/* Ground shadow */}
          <Animated.View style={[styles.groundShadow, shadowStyle]} />
        </Animated.View>
      </GestureDetector>

      {/* Hint */}
      <View style={styles.hintRow}>
        <View style={[styles.dot, { backgroundColor: colors.tint }]} />
        <Text style={[styles.hintText, { color: colors.text }]}>
          DRAG TO ROTATE 360°
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
  viewerBox: {
    width: VIEWER_SIZE,
    height: VIEWER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  shade: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  groundShadow: {
    position: 'absolute',
    bottom: 8,
    width: VIEWER_SIZE * 0.55,
    height: 20,
    backgroundColor: '#000',
    borderRadius: 100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(14px)' } as any) : {}),
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.4,
    marginTop: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  hintText: {
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
});
