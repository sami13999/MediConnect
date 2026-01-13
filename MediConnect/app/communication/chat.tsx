import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View, Alert, Text, Modal, Image, ActionSheetIOS, Share, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '@/components/ui/GlassCard';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams(); // 'id' is the receiverId
  const router = useRouter();
  const { authState } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  const flatListRef = useRef<FlatList>(null); 

  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [chatStatus, setChatStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [isSending, setIsSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const shouldPoll = useRef(true);

  // 1. POLL FOR MESSAGES
  useEffect(() => {
    shouldPoll.current = true;
    fetchMessages();
    const interval = setInterval(() => {
        if (shouldPoll.current) fetchMessages();
    }, 3000); 

    return () => {
        shouldPoll.current = false;
        clearInterval(interval);
    };
  }, [id]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/messages/conversation/?with_user=${id}`);
      setChatHistory(response.data.messages || []);
      if (response.data.status !== chatStatus) {
          setChatStatus(response.data.status);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
          shouldPoll.current = false; 
      }
      console.log("Chat Poll Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom when history changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      // Small delay to ensure layout is ready
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatHistory.length]);


  // 2. SEND MESSAGE
  const handleSend = async (text?: string, imageUri?: string) => {
    const contentToSend = text || message;
    if (!contentToSend.trim() && !imageUri) return;

    // Security check: Patients can only send 1 message until accepted
    if (chatStatus === 'pending' && authState?.role === 'patient') {
      const patientMessagesCount = chatHistory.filter(msg => msg.sender === authState?.userId).length;
      if (patientMessagesCount >= 1) {
        Alert.alert(
          "Security Handshake",
          "You can only send one message until the doctor accepts your request for a secure consultation channel."
        );
        return;
      }
    }
    
    // Non-accepted block for doctors (they must accept first)
    if (chatStatus !== 'accepted' && authState?.role === 'doctor') {
      Alert.alert("Pending Channel", "You must accept this request before you can start messaging.");
      return;
    }
    
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('receiver', id as string);
      if (contentToSend.trim()) formData.append('content', contentToSend);
      
      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: imageUri, name: filename, type } as any);
      }

      await api.post('/chat/messages/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMessage("");
      fetchMessages();
    } catch (error: any) {
      console.log("Send error:", error);
      const detail = error.response?.data?.detail || "Failed to send message.";
      Alert.alert("Error", detail);
    } finally {
      setIsSending(false);
    }
  };

  // 3. ACCEPT REQUEST (Doctor Only)
  const acceptRequest = async () => {
    try {
      await api.post('/chat/messages/accept_request/', { patient_id: id });
      Alert.alert("Success", "Chat request accepted!");
      fetchMessages();
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const startVideoCall = () => {
    router.push({ pathname: '/communication/videocall', params: { id: id, name: name } });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "Allow access to your gallery to share clinical images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      handleSend(undefined, result.assets[0].uri);
    }
  };

  const showHeaderOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'View Profile', 'Clear Chat', 'Mute Notifications', 'Report'],
          destructiveButtonIndex: 4,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setIsInfoVisible(true);
          // Other actions logic...
        }
      );
    } else {
      Alert.alert(
        "Chat Options",
        "Choose an action:",
        [
          { text: "View Profile", onPress: () => setIsInfoVisible(true) },
          { text: "Mute", onPress: () => {} },
          { text: "Report", style: "destructive", onPress: () => {} },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  // --- MESSAGE ACTIONS ---
  const handleLongPress = (msg: any) => {
    setSelectedMessage(msg);
    setIsMenuVisible(true);
  };

  const copyToClipboard = async () => {
    if (selectedMessage?.content) {
      await Clipboard.setStringAsync(selectedMessage.content);
      setIsMenuVisible(false);
      Alert.alert("Copied", "Message copied to clipboard");
    }
  };

  const shareMessage = async () => {
    try {
      if (selectedMessage.image) {
        await Sharing.shareAsync(selectedMessage.image);
      } else if (selectedMessage.content) {
        await Share.share({ message: selectedMessage.content });
      }
    } catch (error) {
      console.log("Share error", error);
    }
    setIsMenuVisible(false);
  };

  const togglePin = async () => {
    try {
      await api.post(`/chat/messages/${selectedMessage.id}/pin_message/`);
      fetchMessages();
      Alert.alert("Success", selectedMessage.is_pinned ? "Message Unpinned" : "Message Pinned");
    } catch (error) {
      Alert.alert("Error", "Failed to toggle pin");
    }
    setIsMenuVisible(false);
  };

  const deleteMessageAction = () => {
    setIsMenuVisible(false);
    const options = [
      { text: "Delete for Me", onPress: () => callDeleteAPI('me') },
      { text: "Cancel", style: "cancel" as any }
    ];

    if (selectedMessage.sender == authState.userId) {
      (options as any).push({ text: "Delete for Everyone", style: "destructive", onPress: () => callDeleteAPI('everyone') });
    }

    Alert.alert("Delete Message?", "Choose how you want to remove this message.", options as any);
  };

  const callDeleteAPI = async (type: 'me' | 'everyone') => {
    try {
      await api.post(`/chat/messages/${selectedMessage.id}/delete_message/`, { type });
      fetchMessages();
    } catch (error) {
      Alert.alert("Error", "Failed to delete message");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative background elements */}
      <View style={[styles.decorCircle, { top: 100, left: -100, backgroundColor: '#0ea5e9', opacity: 0.05 }]} />
      <View style={[styles.decorCircle, { bottom: 200, right: -120, backgroundColor: '#22d3ee', opacity: 0.08 }]} />

      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#0a7ea4', '#003d52']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
        <SafeAreaView style={styles.safeHeader} edges={['top']}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerMain} 
              activeOpacity={0.7}
              onPress={() => setIsInfoVisible(true)}
            >
              <TouchableOpacity 
                onPress={() => setIsPreviewVisible(true)}
                activeOpacity={0.9}
              >
                <View style={styles.headerAvatarWrapper}>
                  <Image 
                    source={{ uri: `https://ui-avatars.com/api/?name=${name}&background=fff&color=0a7ea4` }} 
                    style={styles.headerAvatar} 
                  />
                </View>
              </TouchableOpacity>
              
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle} numberOfLines={1}>{name || 'User Channel'}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: chatStatus === 'accepted' ? '#10B981' : '#FBBF24' }]} />
                  <Text style={styles.statusText}>
                    {chatStatus === 'accepted' ? 'Secured & Active' : 'Waiting for Handshake'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {chatStatus === 'accepted' ? (
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={startVideoCall} style={styles.callHeaderBtn} activeOpacity={0.8}>
                  <Ionicons name="videocam" size={22} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={showHeaderOptions} style={styles.callHeaderBtn} activeOpacity={0.8}>
                  <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
                <View style={styles.headerActions}>
                  <TouchableOpacity onPress={showHeaderOptions} style={styles.callHeaderBtn} activeOpacity={0.8}>
                    <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>
            )}
          </View>
        </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Banner */}
      {chatStatus === 'pending' && (
        <GlassCard style={styles.banner} intensity={30}>
          <View style={styles.bannerContent}>
            <View style={styles.shieldIcon}>
              <Ionicons name="shield-checkmark" size={22} color="#0a7ea4" />
            </View>
            <Text style={styles.bannerText}>
              {authState.role === 'doctor' 
                ? "New patient request. Please accept to start the consultation." 
                : "Connecting you with your doctor. Most doctors reply within minutes."}
            </Text>
            {authState.role === 'doctor' && (
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptRequest} activeOpacity={0.8}>
                <Text style={styles.acceptBtnText}>ACCEPT</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
      )}

      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: 'transparent' }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
      >
        
        {loading ? (
          <ActivityIndicator size="large" color="#0a7ea4" style={{ flex: 1 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatHistory}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
            renderItem={({ item }) => {
              const isDoctor = item.sender_role === 'doctor';
              const isMine = item.sender == authState.userId;
              
              return (
                <View style={[styles.msgContainer, isMine ? styles.myMsgContainer : styles.otherMsgContainer]}>
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onLongPress={() => handleLongPress(item)}
                    delayLongPress={200}
                    style={[
                        styles.bubble, 
                        isMine ? styles.bubbleMine : styles.bubbleOther
                    ]}
                  >
                    {item.is_pinned && (
                      <View style={styles.pinIndicator}>
                        <Ionicons name="pin" size={12} color={isMine ? "#FFF" : "#0a7ea4"} />
                        <Text style={[styles.pinText, { color: isMine ? "rgba(255,255,255,0.7)" : "#64748B" }]}>Pinned</Text>
                      </View>
                    )}
                    {item.image && !item.is_deleted_globally && (
                      <TouchableOpacity 
                        activeOpacity={0.8} 
                        onPress={() => {
                          setSelectedProfile({ profile_picture: item.image, first_name: item.sender_name, last_name: "" });
                          setIsPreviewVisible(true);
                        }}
                        onLongPress={() => handleLongPress(item)}
                        delayLongPress={350}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Image source={{ uri: item.image }} style={styles.msgImage} resizeMode="cover" />
                      </TouchableOpacity>
                    )}
                    {item.is_deleted_globally ? (
                      <Text style={[styles.bubbleText, styles.deletedText]}>
                        *"This message was deleted"*
                      </Text>
                    ) : item.content && (
                      <Text style={[styles.bubbleText, isMine ? styles.textMine : styles.textOther]}>
                        {item.content}
                      </Text>
                    )}
                    <View style={styles.bubbleFooter}>
                      <Text style={[styles.timeText, isMine && { color: 'rgba(255,255,255,0.7)' }]}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Text>
                      {isMine && (
                        <Ionicons name="checkmark-done" size={14} color="#FFF" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}

        <View style={styles.bottomBar}>
          <View style={[
            styles.inputContainer, 
            (chatStatus !== 'accepted' && authState?.role !== 'patient') && styles.disabledInput
          ]}>
            <TouchableOpacity 
              style={styles.attachmentBtn} 
              onPress={pickImage}
              disabled={chatStatus !== 'accepted' && authState?.role !== 'patient'}
            >
              <Ionicons name="camera" size={24} color="#0a7ea4" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={
                chatStatus === 'accepted' 
                  ? "Type a message..." 
                  : (authState?.role === 'patient' ? "Type your first message..." : "Waiting for acceptance...")
              }
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              editable={(chatStatus === 'accepted' || (chatStatus === 'pending' && authState?.role === 'patient')) && !isSending}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!message.trim() || isSending) && styles.disabledBtn]} 
              onPress={() => handleSend()}
              disabled={(!message.trim() && !isSending) || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Profile Image Preview Modal */}
      <Modal
        visible={isPreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPreviewVisible(false)}
      >
        <View style={styles.previewBackdrop}>
          <SafeAreaView style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setIsPreviewVisible(false)} style={styles.previewClose}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>{name}</Text>
          </SafeAreaView>
          <View style={styles.previewContent}>
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=${name}&background=fff&color=0a7ea4&size=500` }} 
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>

      {/* Message Context Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity 
            style={styles.menuBackdrop} 
            activeOpacity={1} 
            onPress={() => setIsMenuVisible(false)}
        >
            <View style={styles.menuContent}>
                <GlassCard style={styles.menuCard} intensity={40}>
                    <TouchableOpacity style={styles.menuItem} onPress={copyToClipboard}>
                        <Ionicons name="copy-outline" size={20} color="#0F172A" />
                        <Text style={styles.menuItemText}>Copy Text</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem} onPress={shareMessage}>
                        <Ionicons name="share-outline" size={20} color="#0F172A" />
                        <Text style={styles.menuItemText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={togglePin}>
                        <Ionicons name="pin-outline" size={20} color="#0F172A" />
                        <Text style={styles.menuItemText}>{selectedMessage?.is_pinned ? 'Unpin Message' : 'Pin Message'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, styles.menuItemDestructive]} onPress={deleteMessageAction}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        <Text style={[styles.menuItemText, styles.destructiveText]}>Delete Message</Text>
                    </TouchableOpacity>
                </GlassCard>
            </View>
        </TouchableOpacity>
      </Modal>

      {/* User Info Modal */}
      <Modal
        visible={isInfoVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsInfoVisible(false)}
      >
        <View style={styles.infoBackdrop}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setIsInfoVisible(false)} 
          />
          <GlassCard style={styles.infoCard} intensity={40}>
            <View style={styles.infoIndicator} />
            <Text style={styles.infoHeading}>Contact Information</Text>
            
            <View style={styles.infoProfileSection}>
              <View style={styles.largeAvatarWrapper}>
                <Image 
                  source={{ uri: `https://ui-avatars.com/api/?name=${name}&background=F0F9FF&color=0a7ea4&size=200` }} 
                  style={styles.largeAvatar} 
                />
              </View>
              <Text style={styles.infoName}>{name}</Text>
              <Text style={styles.infoRole}>{authState.role === 'doctor' ? 'Patient' : 'Healthcare Provider'}</Text>
            </View>

            <View style={styles.infoBioGlass}>
              <Ionicons name="information-circle-outline" size={18} color="#0a7ea4" />
              <Text style={styles.infoBioText}>This consultation is encrypted and secure. All medical information shared remains confidential.</Text>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={styles.actionBox}
                onPress={() => {
                  Alert.alert("Report User", "Are you sure you want to report this user for inappropriate behavior?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Report", style: "destructive", onPress: () => Alert.alert("Reported", "Our team will review this case.") }
                  ]);
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="flag" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Report</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionBox}
                onPress={() => {
                  Alert.alert("Block User", "You will no longer receive any messages from this user. Proceed?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Block", style: "destructive", onPress: () => Alert.alert("Blocked", "User has been blocked successfully.") }
                  ]);
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons name="ban" size={20} color="#64748B" />
                </View>
                <Text style={styles.actionText}>Block</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeBtnInfo} 
              onPress={() => setIsInfoVisible(false)}
            >
              <Text style={styles.closeBtnInfoText}>Close Detailed View</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    width: '100%',
    zIndex: 10,
  },
  decorCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  headerGradient: {
    paddingBottom: 25,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  safeHeader: { paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 5 },
  headerAvatarWrapper: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: { width: '100%', height: '100%' },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  statusText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  callHeaderBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  banner: {
    margin: 20,
    borderRadius: 24,
    padding: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(10, 126, 164, 0.2)',
  },
  bannerContent: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerText: { flex: 1, color: '#1E293B', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  acceptBtn: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginLeft: 10,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

  msgContainer: { marginBottom: 16, width: '100%' },
  myMsgContainer: { alignItems: 'flex-end' },
  otherMsgContainer: { alignItems: 'flex-start' },
  
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bubbleMine: {
    backgroundColor: "#0a7ea4",
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bubbleOther: {
    backgroundColor: "#E2E8F0",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  bubbleText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  msgImage: { width: 240, height: 180, borderRadius: 16, marginBottom: 8 },
  textMine: { color: "#FFF" },
  textOther: { color: "#1E293B" },
  
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  timeText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },

  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
  },
  disabledInput: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  attachmentBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    maxHeight: 120,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: "#0a7ea4",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledBtn: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },

  // Preview Modal Styles
  previewBackdrop: { flex: 1, backgroundColor: '#000' },
  previewHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  previewClose: { marginRight: 20 },
  previewTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  previewContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '80%' },

  // Info Modal Styles
  infoBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  infoCard: { 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 30, 
    paddingTop: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  infoIndicator: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 2.5, alignSelf: 'center', marginBottom: 20 },
  infoHeading: { fontSize: 14, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 25 },
  infoProfileSection: { alignItems: 'center', marginBottom: 25 },
  largeAvatarWrapper: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 4, 
    borderColor: '#FFF', 
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
    backgroundColor: '#F0F9FF',
    marginBottom: 15,
  },
  largeAvatar: { width: '100%', height: '100%' },
  infoName: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  infoRole: { fontSize: 14, fontWeight: '700', color: '#0a7ea4', marginTop: 4 },
  infoBioGlass: { 
    flexDirection: 'row', 
    padding: 15, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoBioText: { flex: 1, fontSize: 12, color: '#64748B', fontWeight: '600', marginLeft: 10, lineHeight: 18 },
  actionGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  actionBox: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  actionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 13, fontWeight: '900', color: '#64748B' },
  closeBtnInfo: { 
    paddingVertical: 18, 
    borderRadius: 20, 
    backgroundColor: '#F1F5F9', 
    alignItems: 'center',
  },
  closeBtnInfoText: { color: '#64748B', fontWeight: '900', fontSize: 14 },
  
  // Menu Modal Styles
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  menuContent: { width: '80%', maxWidth: 300 },
  menuCard: { borderRadius: 24, padding: 10, backgroundColor: 'rgba(255,255,255,0.98)' },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  menuItemText: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginLeft: 15 },
  menuItemDestructive: { marginTop: 5 },
  destructiveText: { color: '#EF4444' },
  
  pinIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
  pinText: { fontSize: 11, fontWeight: '700' },
  deletedText: { color: '#94A3B8', fontStyle: 'italic' },
});
