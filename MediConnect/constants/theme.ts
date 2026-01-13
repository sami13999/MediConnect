
const tintColorLight = '#0077B6'; // Professional Medical Blue
const tintColorDark = '#48CAE4';

export const Colors = {
  light: {
    primary: '#0077B6',      // Main Brand Color (Trust Blue)
    secondary: '#0096C7',    // Lighter accent
    background: '#F4F6F8',   // Light Grey (Standard App Background)
    card: '#FFFFFF',         // Pure White for cards
    text: '#1F2937',         // Dark Grey (Easier on eyes than #000)
    textSecondary: '#6B7280',// Muted text
    border: '#E5E7EB',       // Subtle borders
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    primary: '#48CAE4',
    secondary: '#0077B6',
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  circle: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
};