import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';

export default function DoctorTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0a7ea4",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 90 : 80,
          paddingBottom: Platform.OS === "ios" ? 30 : 20,
          paddingTop: 10,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500", marginTop: -5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "people" : "people-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen name="chat_room" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="verifications" options={{ href: null, tabBarStyle: { display: "none" } }} />

      <Tabs.Screen name="referrals" options={{ href: null, tabBarStyle: { display: "none" } }} />

      <Tabs.Screen
        name="availability"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "person" : "person-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={22}
              name={focused ? "wallet" : "wallet-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
