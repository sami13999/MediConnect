import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock Data
const MOCK_CHATS = [
  {
    id: "1",
    name: "Dr. Sarah Wilson",
    lastMessage: "Please take the medicine twice a day.",
    time: "10:30 AM",
    unread: 2,
    avatar: "S",
  },
  {
    id: "2",
    name: "Dr. Michael Brown",
    lastMessage: "Your report looks good.",
    time: "Yesterday",
    unread: 0,
    avatar: "M",
  },
];

export default function ChatList() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const handleChatPress = (item: (typeof MOCK_CHATS)[0]) => {
    router.push({
      pathname: "/communication/chat",
      params: { id: item.id, name: item.name },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <ThemedText type="title">Messages</ThemedText>
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chatItem, { backgroundColor: theme.card }]}
            onPress={() => handleChatPress(item)}
          >
            <View
              style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}
            >
              <ThemedText style={[styles.avatarText, { color: theme.primary }]}>
                {item.avatar}
              </ThemedText>
            </View>

            <View style={styles.content}>
              <View style={styles.topRow}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.time}>{item.time}</ThemedText>
              </View>
              <ThemedText style={styles.message} numberOfLines={1}>
                {item.lastMessage}
              </ThemedText>
            </View>

            {item.unread > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.badgeText}>{item.unread}</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.icon} />
            <ThemedText style={{ marginTop: 10, color: theme.icon }}>
              No messages yet
            </ThemedText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  list: { padding: 20 },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { fontSize: 20, fontWeight: "bold" },
  content: { flex: 1, marginRight: 8 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  time: { fontSize: 12, color: "#9BA1A6" },
  message: { fontSize: 14, color: "#687076" },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  emptyState: { alignItems: "center", marginTop: 50 },
});
