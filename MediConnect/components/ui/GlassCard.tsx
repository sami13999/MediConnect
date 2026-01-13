import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export const GlassCard = ({ children, style, intensity = 40 }: GlassCardProps) => {
  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} style={styles.blur}>
          {children}
        </BlurView>
      ) : (
        <View style={[styles.fallback, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  blur: {
    padding: 20,
    width: '100%',
  },
  fallback: {
    padding: 20,
    width: '100%',
  }
});
