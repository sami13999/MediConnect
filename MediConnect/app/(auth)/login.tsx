import { StyledButton } from "@/components/ui/StyledButton";
import { StyledInput } from "@/components/ui/StyledInput";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link } from "expo-router";
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

export default function LoginScreen() {
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMsg("Please enter both username and password");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);
    try {
      await login(username, password, role);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || "Invalid Credentials. Please try again.");
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
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header section */}
              <View style={styles.headerSection}>
                <View style={styles.logoBadge}>
                  <Ionicons name="medical" size={40} color="#0a7ea4" />
                </View>
                <Text style={styles.welcomeText}>Welcome to MediConnect</Text>
                <Text style={styles.subText}>Premium Health Management</Text>
              </View>

              {/* Error Banner */}
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Role Selection Tabs */}
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'patient' && styles.roleBtnActive]}
                  onPress={() => setRole('patient')}
                >
                  <Ionicons name="person" size={18} color={role === 'patient' ? '#FFF' : '#6B7280'} />
                  <Text style={[styles.roleBtnText, role === 'patient' && styles.roleBtnTextActive]}>Patient</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'doctor' && styles.roleBtnActive]}
                  onPress={() => setRole('doctor')}
                >
                  <Ionicons name="medical" size={18} color={role === 'doctor' ? '#FFF' : '#6B7280'} />
                  <Text style={[styles.roleBtnText, role === 'doctor' && styles.roleBtnTextActive]}>Doctor</Text>
                </TouchableOpacity>
              </View>

              {/* Inputs */}
              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    containerStyle={styles.inputOveride}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    containerStyle={styles.inputOveride}
                  />
                </View>

                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity style={styles.forgotPass}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </Link>

                <TouchableOpacity 
                  onPress={handleLogin} 
                  disabled={isLoading}
                  style={styles.loginBtn}
                >
                  <LinearGradient
                    colors={['#0a7ea4', '#004d66']}
                    style={styles.loginGradient}
                  >
                    {isLoading ? (
                       <Text style={styles.loginBtnText}>Authenticating...</Text>
                    ) : (
                      <Text style={styles.loginBtnText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.footerSection}>
                <Text style={styles.footerInfo}>Don't have an account?</Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signUpText}> Create Now</Text>
                  </TouchableOpacity>
                </Link>
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
    elevation: 10,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 5 },
  subText: { fontSize: 15, color: '#64748B', fontWeight: '500' },

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

  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 6,
    marginBottom: 30,
  },
  roleBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 15,
    gap: 8
  },
  roleBtnActive: { backgroundColor: '#0a7ea4', elevation: 4 },
  roleBtnText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  roleBtnTextActive: { color: '#FFF' },

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
  forgotPass: { alignSelf: 'flex-end', marginTop: -10 },
  forgotText: { color: '#0a7ea4', fontWeight: '600', fontSize: 13 },

  loginBtn: { borderRadius: 15, overflow: 'hidden', marginTop: 10, elevation: 8 },
  loginGradient: { paddingVertical: 18, alignItems: 'center' },
  loginBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },

  footerSection: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 40,
    alignItems: 'center'
  },
  footerInfo: { color: '#64748B', fontSize: 15 },
  signUpText: { color: '#0a7ea4', fontWeight: '800', fontSize: 15 },
});
