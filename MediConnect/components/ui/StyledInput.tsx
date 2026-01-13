import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface StyledInputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  label?: string;
  containerStyle?: any;
}

export function StyledInput({ icon, isPassword, label, style, containerStyle, ...props }: StyledInputProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [secure, setSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[
        styles.container, 
        { 
          backgroundColor: theme.card,
          borderColor: isFocused ? theme.primary : theme.border,
        },
        
      ]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={isFocused ? theme.primary : theme.icon} 
            style={styles.icon} 
          />
        )}
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          secureTextEntry={secure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons 
              name={secure ? 'eye-off' : 'eye'} 
              size={20} 
              color={theme.icon} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderWidth: 1,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
});