import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, UIManager, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttons?: {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress: () => void;
  }[];
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function CustomAlert({ 
  visible, 
  title, 
  message, 
  onClose, 
  buttons = [{ text: 'OK', onPress: () => {}, style: 'default' }],
  icon,
  iconColor
}: CustomAlertProps) {

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <View style={styles.alertBox}>
          {icon && (
            <View style={[styles.iconCircle, { backgroundColor: iconColor ? `${iconColor}20` : '#0a7ea420' }]}>
               <Ionicons name={icon} size={32} color={iconColor || '#0a7ea4'} />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel ? styles.cancelBtn : styles.defaultBtn,
                    isDestructive && styles.destructiveBtn,
                    buttons.length > 2 && { width: '100%', marginBottom: 8 }
                  ]}
                  onPress={() => {
                    btn.onPress();
                    onClose();
                  }}
                >
                  <Text style={[
                     styles.btnText,
                     isCancel ? styles.cancelText : styles.defaultText,
                     isDestructive && styles.destructiveText
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    justifyContent: 'center'
  },
  button: {
    flex: 1,
    minWidth: '40%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBtn: {
    backgroundColor: '#0a7ea4',
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  destructiveBtn: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    fontWeight: '700',
    fontSize: 15,
  },
  defaultText: { color: '#FFF' },
  cancelText: { color: '#64748B' },
  destructiveText: { color: '#FFF' },
});
