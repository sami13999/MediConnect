import { StyledButton } from "@/components/ui/StyledButton";
import { StyledInput } from "@/components/ui/StyledInput";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
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

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const { register } = useAuth();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setErrorMsg("Username, Email, and Password are required");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);
    try {
      await register({
        username: username,
        email: email,
        password: password,
        role: role,
        first_name: name,
        specialization: specialization,
      });
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || "Registration failed. Check your details.");
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
              <View style={styles.headerSection}>
                <Text style={styles.title}>Join MediConnect</Text>
                <Text style={styles.subtitle}>Start your medical journey today</Text>
              </View>

              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'patient' && styles.roleBtnActive]}
                  onPress={() => setRole('patient')}
                >
                  <Text style={[styles.roleBtnText, role === 'patient' && styles.roleBtnTextActive]}>Patient</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'doctor' && styles.roleBtnActive]}
                  onPress={() => setRole('doctor')}
                >
                  <Text style={[styles.roleBtnText, role === 'doctor' && styles.roleBtnTextActive]}>Doctor</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-circle-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="Username"
                    value={username}
                    autoCapitalize="none"
                    onChangeText={setUsername}
                    containerStyle={styles.inputOverride}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    containerStyle={styles.inputOverride}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="Email Address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    containerStyle={styles.inputOverride}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                  <StyledInput
                    placeholder="Password"
                    isPassword
                    value={password}
                    onChangeText={setPassword}
                    containerStyle={styles.inputOverride}
                  />
                </View>

                {role === "doctor" && (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="medkit-outline" size={20} color="#94A3B8" />
                    <StyledInput
                      placeholder="Specialization (e.g. Cardiologist)"
                      value={specialization}
                      onChangeText={setSpecialization}
                      containerStyle={styles.inputOverride}
                    />
                  </View>
                )}

                <TouchableOpacity 
                   onPress={handleRegister} 
                   disabled={isLoading}
                   style={styles.regBtn}
                >
                  <LinearGradient
                    colors={['#0a7ea4', '#004d66']}
                    style={styles.regGradient}
                  >
                    <Text style={styles.regBtnText}>
                      {isLoading ? "Creating Account..." : "Join Now"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.footerSection}>
                <Text style={styles.footerInfo}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.linkText}> Sign In</Text>
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
  scrollContent: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  
  headerSection: { marginBottom: 35 },
  title: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: { color: '#EF4444', marginLeft: 10, fontSize: 14, fontWeight: '600', flex: 1 },

  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 6,
    marginBottom: 25,
  },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: 15, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#0a7ea4', elevation: 4 },
  roleBtnText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  roleBtnTextActive: { color: '#FFF' },

  formContainer: { gap: 18 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    paddingLeft: 15,
  },
  inputOverride: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 10 },
  
  regBtn: { borderRadius: 15, overflow: 'hidden', marginTop: 10, elevation: 8 },
  regGradient: { paddingVertical: 18, alignItems: 'center' },
  regBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },

  footerSection: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, alignItems: 'center' },
  footerInfo: { color: '#64748B', fontSize: 15 },
  linkText: { color: '#0a7ea4', fontWeight: '800', fontSize: 15 },
});