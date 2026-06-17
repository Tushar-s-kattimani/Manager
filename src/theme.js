import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#004B93', // Pepsi Blue
    onPrimary: '#FFFFFF',
    primaryContainer: '#D1E4FF',
    onPrimaryContainer: '#001D36',
    secondary: '#C9002B', // Pepsi Red
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFDAD6',
    onSecondaryContainer: '#410002',
    tertiary: '#008CBA', // Bright cyan/blue
    onTertiary: '#FFFFFF',
    background: '#F0F4F8', // Soft light gray-blue background
    surface: '#FFFFFF',
    onSurface: '#1A1C1E',
    surfaceVariant: '#DFE2EB',
    onSurfaceVariant: '#43474E',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    elevation: {
      level0: 'transparent',
      level1: '#F6F9FD',
      level2: '#F1F6FC',
      level3: '#EBF2FA',
      level4: '#E9F1F9',
      level5: '#E5EFF8',
    },
  },
  roundness: 12, // Rounder, friendlier look
};
