import api from "@/services/api";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

interface AuthState {
  token: string | null;
  role: "patient" | "doctor" | null;
  userId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (
    username: string,
    password: string,
    role: "patient" | "doctor"
  ) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const segments = useSegments();

  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    role: null,
    userId: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 1. Load Session on App Start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await SecureStore.getItemAsync("access_token");
        const role = await SecureStore.getItemAsync("user_role");

        if (token && role) {
          const userId = await SecureStore.getItemAsync("user_id");
          setAuthState({
            token: token,
            role: role as "patient" | "doctor",
            userId: userId ? parseInt(userId) : null,
            isAuthenticated: true,
            isLoading: false,
          });
          // Restore default header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (e) {
        console.error("Session load error", e);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    loadSession();
  }, []);


// ... inside AuthProvider ...
  // 2. REAL LOGIN FUNCTION
  const login = async (
    username: string,
    password: string,
    selectedRole: "patient" | "doctor"
  ) => {
    try {
      // ✅ Get Push Token before login
      const pushToken = await registerForPushNotificationsAsync();
      console.log("Push Token for Login:", pushToken);

      const response = await api.post("/users/login/", { 
        username, 
        password,
        push_token: pushToken // ✅ Send to backend
      });

      const { access, refresh, role } = response.data;

      if (role !== selectedRole) {
        Alert.alert(
          "Account Info",
          `You logged in as a ${role}, but selected ${selectedRole}. Redirecting to ${role} dashboard.`
        );
      }

      await SecureStore.setItemAsync("access_token", access);
      await SecureStore.setItemAsync("refresh_token", refresh);
      await SecureStore.setItemAsync("user_role", role);
      await SecureStore.setItemAsync("user_id", String(response.data.id));

      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

      setAuthState({
        token: access,
        role: role,
        userId: response.data.id,
        isAuthenticated: true,
        isLoading: false,
      });

      if (role === "doctor") {
        router.replace("/(doctor)");
      } else {
        router.replace("/(patient)");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      // SHOW REAL ERROR
      const msg =
        error.message || error.response?.data?.detail || "Login Failed";
      Alert.alert("Debug Login Error", JSON.stringify(msg));
    }
  };

  // 3. REAL REGISTER FUNCTION (UPDATED)
  const register = async (userData: any) => {
    try {
      await api.post("/users/register/", userData);

      Alert.alert("Success", "Account created! Please login.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (error: any) {
      console.error("Register Error Full:", error);

      let msg = error.message; // Start with the technical error (e.g. "Network Error")

      // If backend sent a specific message (like "Username taken"), use that instead
      if (error.response?.data?.username)
        msg = `Username: ${error.response.data.username[0]}`;
      if (error.response?.data?.email)
        msg = `Email: ${error.response.data.email[0]}`;

      // SHOW THE REAL ERROR TO THE USER
      Alert.alert("Debug Register Error", JSON.stringify(msg));
      throw error; // Let the screen know it failed
    }
  };

  // 4. LOGOUT
  const logout = async () => {
    try {
      // ✅ Optional: Clear push token on backend so this device doesn't get alerts for this user
      await api.patch("/users/profile/", { push_token: null });
    } catch (e) {
      console.log("Push token cleanup failed on logout (ignoring)");
    }

    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user_role");
    await SecureStore.deleteItemAsync("user_id");

    delete api.defaults.headers.common["Authorization"];

    setAuthState({
      token: null,
      role: null,
      userId: null,
      isAuthenticated: false,
      isLoading: false,
    });

    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider value={{ authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
