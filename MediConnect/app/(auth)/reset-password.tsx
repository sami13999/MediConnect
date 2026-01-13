import { StyledButton } from "@/components/ui/StyledButton";
import { StyledInput } from "@/components/ui/StyledInput";
import api from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);
    try {
      await api.post("/users/reset-password/", {
        email,
        otp,
        new_password: newPassword,
      });

      Alert.alert(
        "Success",
        "Your password has been reset successfully.",
        [{ text: "Sign In", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Failed to reset password. Please check your OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F0FDFA', '#FFFFFF']} style={styles.gradientBg}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerSection}>
                <View style={styles.logoBadge}>
                  <Ionicons name="key" size={40} color="#0a7ea4" />
                </View>
                <Text style={styles.welcomeText}>Create New Password</Text>
                <Text style={styles.subText}>Verification code sent to {email}</Text>
              </View>

              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="6-Digit OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    containerStyle={styles.inputOveride}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    isPassword
                    containerStyle={styles.inputOveride}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    isPassword
                    containerStyle={styles.inputOveride}
                  />
                </View>

                <TouchableOpacity 
                  onPress={handleResetPassword} 
                  disabled={isLoading}
                  style={styles.actionBtn}
                >
                  <LinearGradient
                    colors={['#0a7ea4', '#004d66']}
                    style={styles.btnGradient}
                  >
                    {isLoading ? (
                       <Text style={styles.btnText}>Processing...</Text>
                    ) : (
                      <Text style={styles.btnText}>Reset Password</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  gradientBg: { flex: 1 },
  container: { flex: 1 },
  backBtn: { padding: 20, position: 'absolute', top: 10, left: 10, zIndex: 10 },
  scrollContent: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  
  headerSection: { alignItems: 'center', marginBottom: 40 },
  logoBadge: {
    width: 90,
    height: 90,
    backgroundColor: '#FFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 5 },
  subText: { fontSize: 15, color: '#64748B', fontWeight: '500', textAlign: 'center' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: { color: '#EF4444', marginLeft: 10, fontSize: 14, fontWeight: '600', flex: 1 },

  formContainer: { gap: 20 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    paddingLeft: 15,
  },
  inputOveride: { 
    flex: 1, 
    borderWidth: 0, 
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },

  actionBtn: { borderRadius: 15, overflow: 'hidden', marginTop: 10, elevation: 8 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
});
