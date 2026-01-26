import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react'; // <-- IMPORT useState
import { ActivityIndicator, View } from 'react-native'; // <-- IMPORT View/ActivityIndicator
import { AuthProvider, useAuth } from '../context/AuthContext';

// Export unstable_settings to anchor the layout at (tabs)
export const unstable_settings = {
  initialRouteName: '(auth)',
};

import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function RootLayoutNav() {
  const { authState } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // NEW: Introduce a state to manage when the layout is considered 'loaded'
  const [loaded, setLoaded] = useState(false);

  // 1. Notification Listeners
  useEffect(() => {
    if (isExpoGo) return;

    let sub1: any;
    let sub2: any;

    import('expo-notifications').then(Notifications => {
      sub1 = Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification Received while app open:", notification);
      });

      sub2 = Notifications.addNotificationResponseReceivedListener(response => {
        console.log("User tapped on notification:", response);
      });
    });

    return () => {
      sub1?.remove();
      sub2?.remove();
    };
  }, []);

  // Use a separate effect to simulate checking auth/loading status
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Use the loaded state to gate the navigation logic
  useEffect(() => {
    if (!loaded) return; // Wait until the initial load check is complete

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthenticated = authState.isAuthenticated;

    if (!isAuthenticated && !inAuthGroup) {
      // If not authenticated and not in the auth group, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // If authenticated and in the auth group (e.g., just logged in),
      // redirect to the correct app section
      if (authState.role === 'patient') {
        router.replace('/(patient)');
      } else if (authState.role === 'doctor') {
        router.replace('/(doctor)');
      }
    }
  }, [loaded, authState.isAuthenticated, authState.role, segments, router]);

  // RENDER LOADING SCREEN IF NOT LOADED
  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // RENDER THE STACK ONCE LOADED
  return (
    <Stack>
      {/* The Auth group (login, register) */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
      {/* The Patient app (tabs) */}
      <Stack.Screen name="(patient)" options={{ headerShown: false }} />
      
      {/* The Doctor app (tabs) */}
      <Stack.Screen name="(doctor)" options={{ headerShown: false }} />

      {/* Common Screens */}
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
    </Stack>
  );
}

// Root layout that wraps everything (no changes here, already correct)
import { AlertProvider } from '../context/AlertContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <AlertProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AlertProvider>
    </AuthProvider>
  );
}