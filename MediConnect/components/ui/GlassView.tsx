import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  borderRadius?: number;
}

export function GlassView({ children, style, intensity = 20, borderRadius = 16, ...props }: GlassViewProps) {
  // Android doesn't always handle BlurView overlay perfectly, so we add a fallback background
  const isAndroid = Platform.OS === 'android';

  return (
    <View style={[styles.container, { borderRadius }, style]} {...props}>
      <BlurView 
        intensity={intensity} 
        tint="dark" // Using dark tint for contrast against the dark gradient background
        style={StyleSheet.absoluteFill} 
      />
      {/* Semi-transparent overlay for color tinting */}
      <View style={[styles.overlay, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.15)', // Subtle glass border
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    zIndex: 1,
  },
});