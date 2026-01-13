import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

interface ScreenWrapperProps extends SafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  bg?: string; // Optional override
}

export function ScreenWrapper({ children, style, bg, ...props }: ScreenWrapperProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg || theme.background }]} {...props}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.content, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});