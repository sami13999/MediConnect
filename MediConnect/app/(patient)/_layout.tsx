import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform } from "react-native";

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0a7ea4",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
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
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: "Records",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Messages Tab */}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={24}
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
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* 🛑 HIDDEN SCREENS */}
      <Tabs.Screen
        name="book_appointment"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen
        name="chat_room"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
    </Tabs>
  );
}
