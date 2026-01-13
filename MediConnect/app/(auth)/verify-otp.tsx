import { StyledButton } from '@/components/ui/StyledButton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyOtpScreen() {
  const { email, role } = useLocalSearchParams<{ email: string; role: string }>();
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for auto-focusing next input
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto focus prev on delete
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 4) {
      setIsLoading(true);
      setTimeout(() => {
        // Complete registration and login
        // Force type casting for role since query params are strings
        login((role as 'patient' | 'doctor') || 'patient');
      }, 1500);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFF' }]}>
      <View style={styles.content}>
        
        {/* Icon & Header */}
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={48} color="#0a7ea4" />
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>Verification Code</Text>
        <Text style={styles.subtitle}>
          We have sent the code verification to {'\n'}
          <Text style={{ fontWeight: 'bold', color: '#0a7ea4' }}>{email || 'your email'}</Text>
        </Text>

        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput, 
                { 
                  borderColor: digit ? '#0a7ea4' : '#E5E5EA',
                  backgroundColor: digit ? '#E6F4FE' : '#FAFAFA'
                }
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(val) => handleOtpChange(val, index)}
              selectTextOnFocus
            />
          ))}
        </View>

        <StyledButton 
          title="Verify & Proceed" 
          onPress={handleVerify}
          isLoading={isLoading}
        />

        {/* Resend Timer */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          <TouchableOpacity disabled={timer > 0}>
            <Text style={[styles.resendLink, { opacity: timer > 0 ? 0.5 : 1 }]}>
              Resend {timer > 0 ? `in ${timer}s` : 'Now'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconContainer: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#E6F4FE',
    justifyContent: 'center', alignItems: 'center', marginBottom: 32
  },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#687076', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  otpContainer: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  otpInput: {
    width: 64, height: 64, borderRadius: 16, borderWidth: 1.5,
    fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#0a7ea4'
  },
  resendContainer: { flexDirection: 'row', marginTop: 32 },
  resendText: { color: '#687076', fontSize: 16 },
  resendLink: { color: '#0a7ea4', fontWeight: 'bold', fontSize: 16 },
});