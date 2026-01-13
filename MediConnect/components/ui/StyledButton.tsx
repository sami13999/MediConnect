import { BorderRadius, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface StyledButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export function StyledButton({ title, variant = 'primary', isLoading, style, ...props }: StyledButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.background === '#111827' ? '#374151' : '#E0F2FE'; // Subtle blue tint
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return theme.primary; // Blue text on light bg
      case 'outline': return theme.primary;
      case 'ghost': return theme.textSecondary;
      default: return '#FFFFFF';
    }
  };

  const getBorder = () => {
    if (variant === 'outline') return { borderWidth: 1.5, borderColor: theme.primary };
    return {};
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        style,
        props.disabled && { opacity: 0.6 }
      ]}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});