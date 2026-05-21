/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#111111',
    background: '#F6F1EB',
    cardBackground: '#E7E0D8',
    tint: '#111111',
    icon: '#666666',
    border: 'rgba(255, 255, 255, 0.3)',
    tabIconDefault: '#999999',
    tabIconSelected: '#111111',
    glass: 'rgba(231, 224, 216, 0.6)',
  },
  dark: {
    text: '#111111', // Make text dark as background is now ivory
    background: '#F6F1EB', // Forced to Ivory as requested
    cardBackground: '#E7E0D8',
    tint: '#111111',
    icon: '#666666',
    border: 'rgba(0, 0, 0, 0.1)',
    tabIconDefault: '#666666',
    tabIconSelected: '#111111',
    glass: 'rgba(231, 224, 216, 0.6)',
  },
};

export const Spacing = {
  xs: 8,
  s: 16,
  m: 24,
  l: 32,
  xl: 48,
  xxl: 64,
  xxxl: 96,
};

export const Typography = {
  heroTitle: {
    fontSize: 56,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  sectionHeading: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase' as const,
    letterSpacing: -0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  smallText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999999',
  },
  price: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  }
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter-Regular',
    serif: 'Inter-Regular',
  },
  default: {
    sans: 'Inter-Regular',
    serif: 'Inter-Regular',
  },
});

export const AdminTheme = {
  background: '#F9F5EF',
  primaryDark: '#3B2A1A',
  accent: '#C9A96E',
  secondary: '#8A9E85',
  surface: '#EAE4DC',
  textPrimary: '#1C1410',
  textMuted: '#7A6A5A',
};
