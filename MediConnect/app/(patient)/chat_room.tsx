import api from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ImageBackground,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

export default function ChatRoom() {
  const router = useRouter();
  const { authState } = useAuth();
  const params = useLocalSearchParams();

  const receiverId = params.receiverId;
  const receiverName = params.receiverName || "Doctor";
  const receiverAvatar = params.receiverAvatar;

  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("pending"); // Track acceptance status
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const shouldPoll = useRef(true);



  useEffect(() => {
    if (!receiverId) return;
    shouldPoll.current = true;
    fetchMessages();
    const interval = setInterval(() => {
        if (shouldPoll.current) fetchMessages();
    }, 3000);

    return () => {
        shouldPoll.current = false;
        clearInterval(interval);
    };
  }, [receiverId]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(
        `/chat/messages/conversation/?with_user=${receiverId}`
      );
      setMessages(res.data.messages || []);
      setStatus(res.data.status);
    } catch (error: any) {
      if (error.response?.status === 401) {
          shouldPoll.current = false;
      }
      console.log("Chat Room Poll Error:", error.message);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.post("/chat/messages/", {
        receiver: receiverId,
        content: newMessage,
      });
      setNewMessage("");
      fetchMessages();
    } catch (error: any) {
      if (error.response?.data?.code === "pending_approval") {
        alert(
          "Limit Reached: Please wait for the doctor to accept your request."
        );
      }
    }
  };

  const handleBack = () => {
    router.push("/(patient)/messages");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.avatar}>
              {receiverAvatar ? (
                <Image source={{ uri: receiverAvatar as string }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{receiverName[0]}</Text>
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.name}>Dr. {receiverName}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: status === "accepted" ? "#4CAF50" : "#FF9800" }]} />
                <Text style={styles.status}>
                  {status === "accepted" ? "Online" : "Awaiting Approval"}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Ionicons name="videocam-outline" size={24} color="#0a7ea4" />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView 
        style={[styles.keyboardContainer]} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: any) => item.id.toString()}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
          style={styles.list}
          renderItem={({ item }) => {
            const isMyMsg = item.sender_id === authState.userId;
            return (
              <View style={[styles.msgWrapper, isMyMsg ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
                <View style={[styles.msgBubble, isMyMsg ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.msgText, isMyMsg ? styles.myText : styles.theirText]}>
                    {item.content}
                  </Text>
                  <View style={styles.msgFooter}>
                    <Text style={[styles.time, isMyMsg ? styles.myTime : styles.theirTime]}>
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {isMyMsg && (
                      <Ionicons name="checkmark-done" size={16} color="#4FC3F7" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Input Bar - LOCKED if not accepted */}
        {status === "accepted" || messages.length === 0 ? (
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Message..."
                placeholderTextColor="#999"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                <Ionicons name="send" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.lockedBar}>
            <Ionicons name="lock-closed" size={20} color="#856404" />
            <Text style={styles.lockedText}>
              Chat paused until Doctor accepts.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E5DDD5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  backBtn: { padding: 8, marginRight: 2 },
  headerInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { color: "white", fontWeight: "bold", fontSize: 18 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  status: { fontSize: 12, color: "#6B7280" },
  callBtn: { padding: 10 },
  headerTextContainer: { flex: 1, justifyContent: 'center' },
  
  keyboardContainer: { flex: 1 },
  list: { flex: 1 },
  
  msgWrapper: { marginBottom: 8, width: '100%' },
  myMsgWrapper: { alignItems: 'flex-end' },
  theirMsgWrapper: { alignItems: 'flex-start' },
  
  msgBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  myBubble: {
    backgroundColor: "#E7FFDB",
    borderTopRightRadius: 4,
    marginRight: 4,
  },
  theirBubble: {
    backgroundColor: "white",
    borderTopLeftRadius: 4,
    marginLeft: 4,
  },
  msgText: { fontSize: 15, lineHeight: 20 },
  myText: { color: "#111827" },
  theirText: { color: "#111827" },
  
  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  time: { fontSize: 11 },
  myTime: { color: "#749561" },
  theirTime: { color: "#9CA3AF" },

  inputWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#E5DDD5",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "white",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#0a7ea4",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  lockedBar: {
    margin: 15,
    padding: 15,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  lockedText: { color: "#92400E", marginLeft: 10, fontWeight: "600", fontSize: 14 },
});
