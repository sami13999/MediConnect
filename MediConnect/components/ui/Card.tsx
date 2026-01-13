import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'flat';
  onPress?: () => void;
}

export function Card({ children, style, variant = 'elevated', onPress, ...props }: CardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const cardStyles = [
    styles.card,
    { backgroundColor: theme.card },
    variant === 'elevated' && Shadows.small,
    variant === 'outlined' && { borderWidth: 1, borderColor: theme.border },
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles as any} 
        activeOpacity={0.7} 
        onPress={onPress} 
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
});