import api from "@/services/api";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ActionSheetIOS,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAlert } from "@/context/AlertContext";

export default function DoctorChatRoom() {
  const router = useRouter();
  const { authState } = useAuth();
  const { showAlert } = useAlert();
  const params = useLocalSearchParams();

  const receiverId = params.receiverId;
  const receiverName = params.receiverName;
  
  // Ensure we have a full URL for the avatar (Media is served from root, not /api)
  const rawAvatar = params.receiverAvatar as string;
  const apiBase = process.env.EXPO_PUBLIC_API_URL || "";
  const baseHost = apiBase.split('/api')[0];
  
  // Robust image URL handling
  const getFullImageUrl = (path: string) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `${baseHost}${path}`;
  };

  const receiverAvatar = getFullImageUrl(rawAvatar);

  const [isAccepted, setIsAccepted] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Image Selection & Preview States
  const [imageToUpload, setImageToUpload] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [isSendPreviewVisible, setIsSendPreviewVisible] = useState(false);
  
  // Generic Full-Screen Preview State
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  
  // Message Action States
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [isDeleteOptionsVisible, setIsDeleteOptionsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  
  const flatListRef = useRef<FlatList>(null);
  const shouldPoll = useRef(true);



  useEffect(() => {
    shouldPoll.current = true;
    fetchMessages();
    fetchHistory();
    const interval = setInterval(() => {
        if (shouldPoll.current) fetchMessages();
    }, 3000);
    
    return () => {
        shouldPoll.current = false;
        clearInterval(interval);
    };
  }, []);

  const fetchHistory = async () => {
    if (!receiverId) return;
    setLoadingHistory(true);
    try {
      const res = await api.get(`/medical_records/?patient=${receiverId}`);
      setHistory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      showAlert({ title: "Generating...", message: "Creating a professional medical report PDF.", icon: "document-text-outline" });
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
              .header { border-bottom: 3px solid #0a7ea4; padding-bottom: 20px; margin-bottom: 30px; }
              .title { color: #0a7ea4; font-size: 32px; font-weight: bold; margin: 0; }
              .patient-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
              .label { color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; }
              .value { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
              .history-item { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
              .date { color: #0a7ea4; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">MEDICONNECT</h1>
              <p>Official Patient Medical History Summary</p>
            </div>
            <div class="patient-box">
              <p class="label">Patient Name</p>
              <p class="value">${receiverName}</p>
              <p class="label">Patient ID</p>
              <p class="value">#${receiverId}</p>
            </div>
            <h2 style="color: #1e293b;">Clinical History</h2>
            ${history.map(h => `
              <div class="history-item">
                <p class="date">${new Date(h.created_at || h.date).toLocaleDateString()}</p>
                <p style="font-weight: bold; font-size: 16px;">${h.diagnosis}</p>
                <p style="color: #4b5563;">${h.prescription || h.notes}</p>
              </div>
            `).join('')}
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      showAlert({ title: "Error", message: "Failed to generate report.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
  };

  const fetchMessages = async () => {
    try {
      if (!receiverId) return;
      const res = await api.get(
        `/chat/messages/conversation/?with_user=${receiverId}`
      );
      setMessages(res.data.messages);
      const accepted = res.data.status === "accepted";
      if (accepted !== isAccepted) setIsAccepted(accepted);
    } catch (error: any) {
      if (error.response?.status === 401) {
          shouldPoll.current = false;
      }
      console.log("Chat Poll Error:", error.message);
    }
  };

  // Scroll to bottom when messages changes
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const acceptChat = async () => {
    try {
      await api.post("/chat/messages/accept_request/", {
        patient_id: receiverId,
      });
      setIsAccepted(true);
      showAlert({ title: "Success", message: "Request Accepted.", icon: "checkmark-circle-outline" });
    } catch (e) {
      showAlert({ title: "Error", message: "Could not accept request.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
  };

  const showAttachmentOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          if (buttonIndex === 2) pickGalleryImage();
        }
      );
    } else {
      showAlert({
        title: "Share Image",
        message: "Select source:",
        buttons: [
          { text: "Camera", onPress: takePhoto },
          { text: "Gallery", onPress: pickGalleryImage },
          { text: "Cancel", style: "cancel" }
        ],
        icon: "images-outline"
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return showAlert({ title: "Error", message: "Camera access denied", icon: "camera-outline", iconColor: "#EF4444" });
    
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageToUpload(result.assets[0].uri);
      setIsSendPreviewVisible(true);
    }
  };

  const pickGalleryImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return showAlert({ title: "Error", message: "Gallery access denied", icon: "images-outline", iconColor: "#EF4444" });

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageToUpload(result.assets[0].uri);
      setIsSendPreviewVisible(true);
    }
  };

  const handleSendImageWithCaption = async () => {
    if (!imageToUpload) return;
    await handleSend(imageCaption, imageToUpload);
    setIsSendPreviewVisible(false);
    setImageToUpload(null);
    setImageCaption("");
  };

  const handleSend = async (text?: string, imageUri?: string) => {
    const contentToSend = text || newMessage;
    if (!contentToSend.trim() && !imageUri) return;
    
    if (!isAccepted) {
      showAlert({ title: "Pending Channel", message: "Please accept this consultation request before sending a message.", icon: "time-outline" });
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('receiver', receiverId as string);
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
      
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.log("Send error:", error);
      showAlert({ title: "Error", message: "Failed to send message.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (type: 'me' | 'everyone') => {
    if (!selectedMessage) return;
    try {
      await api.post(`/chat/messages/${selectedMessage.id}/delete_message/`, { type });
      setIsDeleteOptionsVisible(false);
      setIsActionsVisible(false);
      fetchMessages();
    } catch (error) {
      showAlert({ title: "Error", message: "Failed to delete message.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
  };

  const handleEditMessage = async () => {
    if (!selectedMessage || !editContent.trim()) return;
    try {
      await api.patch(`/chat/messages/${selectedMessage.id}/edit_message/`, { content: editContent });
      setIsEditing(false);
      setEditContent("");
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      showAlert({ title: "Error", message: "Failed to edit message.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
  };

  const handleCopyMessage = async (content: string) => {
    await Clipboard.setStringAsync(content);
    showAlert({ title: "Copied", message: "Message copied to clipboard.", icon: "copy-outline" });
    setIsActionsVisible(false);
  };

  const handlePinMessage = async (message: any) => {
    try {
      await api.post(`/chat/messages/${message.id}/pin_message/`);
      fetchMessages();
    } catch (error) {
      showAlert({ title: "Error", message: "Failed to pin message.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
  };

  const handleShareMessage = async (message: any) => {
    try {
      const content = message.content || "MedicConnect Clinical Image";
      if (message.image) {
          const fullImageUrl = message.image.startsWith('http') 
              ? message.image 
              : `${(process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0]}${message.image}`;
          await Sharing.shareAsync(fullImageUrl);
      } else {
          await Sharing.shareAsync(content);
      }
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const showOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Clinical History', 'Refer Patient', 'Clear History', 'Flag Account'],
          destructiveButtonIndex: 4,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setIsHistoryVisible(true);
          if (buttonIndex === 2) {
            router.push({
              pathname: "/(doctor)/referrals",
              params: { preSelectedPatientId: receiverId as string }
            });
          }
        }
      );
    } else {
      showAlert({
        title: "Options",
        message: "Choose an action:",
        buttons: [
          { text: "Clinical History", onPress: () => setIsHistoryVisible(true) },
          { text: "Refer Patient", onPress: () => router.push({
              pathname: "/(doctor)/referrals",
              params: { preSelectedPatientId: receiverId as string }
            }) 
          },
          { text: "Cancel", style: "cancel" }
        ],
        icon: "options-outline"
      });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#0a7ea4', '#003d52']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.safeHeader} edges={['top']}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.push("/(doctor)/messages");
                  }
                }} 
                style={styles.backBtn} 
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={28} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.headerCenter} 
                activeOpacity={0.7}
                onPress={() => setIsInfoVisible(true)}
              >
                <View style={styles.avatarBorder}>
                  <View style={styles.avatarGlow} />
                  {receiverAvatar ? (
                    <TouchableOpacity 
                      onPress={() => {
                        setPreviewUri(receiverAvatar);
                        setPreviewTitle("Profile Photo");
                        setIsPreviewVisible(true);
                      }}
                    >
                      <Image 
                        source={{ uri: receiverAvatar }} 
                        style={styles.avatarMini} 
                        resizeMode="cover"
                        onError={(e) => console.log("Image Load Error:", e.nativeEvent.error)}
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarTextMini}>{receiverName ? receiverName[0] : "P"}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.titleWrapper}>
                  <Text style={styles.headerTitleText} numberOfLines={1}>{receiverName || "Patient"}</Text>
                  <View style={styles.statusRowHeader}>
                    <View style={[styles.statusDotHeader, { backgroundColor: isAccepted ? "#10B981" : "#FBBF24" }]} />
                    <Text style={styles.statusTextHeader}>
                      {isAccepted ? "Active Consultation" : "Awaiting Acceptance"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.callBtnHeader} activeOpacity={0.7} onPress={() => showAlert({ title: "Coming Soon", message: "Video consultation feature is being activated.", icon: "videocam-outline" })}>
                  <Ionicons name="videocam" size={22} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.callBtnHeader} activeOpacity={0.7} onPress={showOptions}>
                  <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Accept Bar */}
      {!isAccepted && (
        <GlassCard style={styles.acceptBanner} intensity={40}>
          <View style={styles.acceptInfo}>
            <View style={styles.shieldIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#FFF" />
            </View>
            <View style={styles.acceptTextWrapper}>
              <Text style={styles.acceptBannerTitle}>Privacy Protected Chat</Text>
              <Text style={styles.acceptBannerText}>Review and accept to start the session.</Text>
            </View>
          </View>
          <TouchableOpacity onPress={acceptChat} style={styles.acceptActionBtn} activeOpacity={0.8}>
            <Text style={styles.acceptActionText}>Accept & Begin Session</Text>
          </TouchableOpacity>
        </GlassCard>
      )}
      {/* Keyboard Avoiding View for Chat */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
      >

      {/* Messages */}
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
          renderItem={({ item }) => {
            const isDoctor = item.sender_role === 'doctor';
            const isMe = item.sender_id === authState.userId;
            
            return (
              <View style={[styles.msgContainer, isDoctor ? styles.doctorMsg : styles.patientMsg]}>
                <TouchableOpacity 
                   activeOpacity={0.8}
                   onLongPress={() => {
                      if (!item.is_deleted_for_everyone) {
                          setSelectedMessage(item);
                          setIsActionsVisible(true);
                      }
                   }}
                   delayLongPress={300}
                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                   style={[styles.bubble, isDoctor ? styles.bubbleDoctor : styles.bubblePatient]}
                >
                  {item.is_pinned && (
                    <View style={styles.pinIndicator}>
                       <Ionicons name="pin" size={10} color={isDoctor ? "#FFF" : "#0a7ea4"} />
                       <Text style={[styles.pinText, { color: isDoctor ? "#FFF" : "#0a7ea4" }]}>Pinned</Text>
                    </View>
                  )}
                  {item.image && (
                    <TouchableOpacity 
                      activeOpacity={0.9} 
                      onPress={() => {
                        const fullImageUrl = item.image.startsWith('http') 
                          ? item.image 
                          : `${(process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0]}${item.image}`;
                        setPreviewUri(fullImageUrl);
                        setPreviewTitle("View Image");
                        setIsPreviewVisible(true);
                      }}
                    >
                      <Image source={{ uri: item.image.startsWith('http') ? item.image : `${(process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0]}${item.image}` }} style={styles.msgImage} resizeMode="cover" />
                    </TouchableOpacity>
                  )}
                  {item.content && (
                    <Text style={[
                       styles.messageContent, 
                       isDoctor ? styles.textDoctor : styles.textPatient,
                       item.is_deleted_for_everyone && styles.deletedText
                    ]}>
                      {item.content}
                    </Text>
                  )}
                  <View style={styles.bubbleFooter}>
                    {item.is_edited && !item.is_deleted_for_everyone && (
                        <Text style={[styles.editedText, isDoctor && { color: 'rgba(255,255,255,0.7)' }]}>Edited </Text>
                    )}
                    <Text style={[styles.timeText, isDoctor && { color: 'rgba(255,255,255,0.7)' }]}>
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {isMe && (
                      <Ionicons name="checkmark-done" size={14} color={isDoctor ? "#FFF" : "#0a7ea4"} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />

        {/* Input */}
        {isAccepted ? (
          <View style={styles.inputWrapper}>
            {isEditing ? (
              <View style={styles.editInputContainer}>
                <TouchableOpacity onPress={() => { setIsEditing(false); setEditContent(""); }} style={styles.cancelEditBtn}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
                <TextInput
                  style={styles.editInput}
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                />
                <TouchableOpacity onPress={handleEditMessage} style={styles.saveEditBtn}>
                  <Ionicons name="checkmark" size={24} color="#0a7ea4" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputOuterContainer}>
                <TouchableOpacity 
                  style={styles.attachmentBtn} 
                  onPress={showAttachmentOptions}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={24} color="#0a7ea4" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Type medical response..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={1000}
                  editable={isAccepted && !isSending}
                />
                <TouchableOpacity 
                  onPress={() => handleSend()} 
                  style={[styles.sendBtn, (!newMessage.trim() || isSending) && styles.disabledBtn]} 
                  activeOpacity={0.8} 
                  disabled={(!newMessage.trim() && !isSending) || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Ionicons name="send" size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.lockedBar}>
            <Ionicons name="lock-closed" size={22} color="#64748B" />
            <Text style={styles.lockedText}>Consultation not yet initialized</Text>
          </View>
        )}

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
            <Text style={styles.previewTitle}>{previewTitle || receiverName}</Text>
          </SafeAreaView>
          <View style={styles.previewContent}>
            {previewUri ? (
              <Image 
                key={previewUri}
                source={{ uri: previewUri }} 
                style={styles.fullImage} 
                resizeMode="contain" 
              />
            ) : (
              <View style={styles.largePlaceholder}>
                <Text style={styles.largePlaceholderText}>{receiverName ? receiverName[0] : "P"}</Text>
              </View>
            )}
          </View>
        </View>
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
            <Text style={styles.infoHeading}>Patient Information</Text>
            
            <View style={styles.infoProfileSection}>
              <TouchableOpacity 
                style={styles.largeAvatarWrapper} 
                activeOpacity={0.9}
                onPress={() => {
                   if (receiverAvatar) {
                      setPreviewUri(receiverAvatar);
                      setPreviewTitle("Profile Photo");
                      setIsPreviewVisible(true);
                   }
                }}
              >
                {receiverAvatar ? (
                  <Image source={{ uri: receiverAvatar as string }} style={styles.largeAvatar} />
                ) : (
                  <View style={styles.largeAvatarPlaceholder}>
                     <Text style={styles.largeAvatarText}>{receiverName ? receiverName[0] : "P"}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.infoName}>{receiverName}</Text>
              <Text style={styles.infoRole}>Verified Patient</Text>
            </View>

            <View style={styles.infoBioGlass}>
              <Ionicons name="shield-checkmark" size={18} color="#0a7ea4" />
              <Text style={styles.infoBioText}>This patient is connected to your clinical panel. Communications are monitored for safety and compliance.</Text>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={styles.actionBox}
                onPress={() => setIsHistoryVisible(true)}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
                  <Ionicons name="document-text" size={20} color="#0a7ea4" />
                </View>
                <Text style={styles.actionText}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionBox}
                onPress={handleDownloadReport}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="download" size={20} color="#10B981" />
                </View>
                <Text style={styles.actionText}>Report</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionBox}
                onPress={() => {
                  setIsInfoVisible(false);
                  router.push({
                    pathname: "/(doctor)/referrals",
                    params: { preSelectedPatientId: receiverId as string }
                  });
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="share-social" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.actionText}>Refer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={styles.actionBox}
                onPress={() => {
                  showAlert({
                    title: "Report Patient",
                    message: "Are you sure you want to report this patient for inappropriate behavior?",
                    icon: "flag",
                    iconColor: "#EF4444",
                    buttons: [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Report", 
                        style: "destructive", 
                        onPress: () => showAlert({ title: "Reported", message: "Our team will review this case.", icon: "checkmark-circle" }) 
                      }
                    ]
                  });
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
                  showAlert({
                    title: "Block Patient",
                    message: "You will no longer receive any messages from this patient. Proceed?",
                    icon: "ban",
                    buttons: [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Block", 
                        style: "destructive", 
                        onPress: () => showAlert({ title: "Blocked", message: "Patient has been blocked successfully.", icon: "checkmark-circle" }) 
                      }
                    ]
                  });
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F8FAFC' }]}>
                  <Ionicons name="ban" size={20} color="#64748B" />
                </View>
                <Text style={styles.actionText}>Block</Text>
              </TouchableOpacity>
              
              <View style={[styles.actionBox, { opacity: 0, borderWidth: 0 }]} />
            </View>

            <TouchableOpacity 
              style={styles.closeBtnInfo} 
              onPress={() => setIsInfoVisible(false)}
            >
              <Text style={styles.closeBtnInfoText}>Back to Conversation</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>

      {/* Clinical History Modal */}
      <Modal
        visible={isHistoryVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <View style={styles.infoBackdrop}>
           <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsHistoryVisible(false)} />
           <View style={styles.historyModalContainer}>
              <View style={styles.historyHeaderRow}>
                 <Text style={styles.historyModalTitle}>Clinical History</Text>
                 <TouchableOpacity onPress={() => setIsHistoryVisible(false)}>
                    <Ionicons name="close-circle" size={32} color="#94A3B8" />
                 </TouchableOpacity>
              </View>
              
              {loadingHistory ? (
                <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 50 }} />
              ) : (
                <FlatList
                  data={history}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <GlassCard style={styles.historyItemCard} intensity={25}>
                       <View style={styles.historyBadge}>
                          <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                       </View>
                       <Text style={styles.historyDiagnosis}>{item.diagnosis}</Text>
                       <Text style={styles.historyNotes}>{item.prescription || item.notes}</Text>
                    </GlassCard>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyHistory}>
                       <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
                       <Text style={styles.emptyHistoryText}>No records found for this patient.</Text>
                    </View>
                  }
                  contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                />
              )}
              <View style={styles.historyFooter}>
                <TouchableOpacity style={styles.downloadBtnLarge} onPress={handleDownloadReport}>
                  <Ionicons name="download-outline" size={20} color="#FFF" />
                  <Text style={styles.downloadBtnText}>Download Full Report (PDF)</Text>
                </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
      {/* WhatsApp Style Image Send Preview Modal */}
      <Modal
        visible={isSendPreviewVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsSendPreviewVisible(false)}
      >
        <View style={styles.sendPreviewContainer}>
          <SafeAreaView style={styles.sendPreviewHeader}>
            <TouchableOpacity onPress={() => setIsSendPreviewVisible(false)} style={styles.sendPreviewClose}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.sendPreviewTitle}>Send Image</Text>
          </SafeAreaView>

          <View style={styles.sendPreviewImageWrapper}>
            {imageToUpload && (
              <Image source={{ uri: imageToUpload }} style={styles.sendPreviewImage} resizeMode="contain" />
            )}
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.sendPreviewFooter}
          >
            <View style={styles.captionInputContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor="#94A3B8"
                value={imageCaption}
                onChangeText={setImageCaption}
                multiline
              />
              <TouchableOpacity 
                style={styles.sendImageBtn} 
                onPress={handleSendImageWithCaption}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Ionicons name="send" size={24} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* --- NEW MESSAGE ACTIONS MODAL --- */}
      <Modal
        visible={isActionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsActionsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.actionsBackdrop} 
          activeOpacity={1} 
          onPress={() => setIsActionsVisible(false)}
        >
          <GlassCard style={styles.actionsCard} intensity={40}>
             <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionItem} onPress={() => handleCopyMessage(selectedMessage?.content || "")}>
                   <Ionicons name="copy-outline" size={22} color="#475569" />
                   <Text style={styles.actionItemText}>Copy Text</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => { handlePinMessage(selectedMessage); setIsActionsVisible(false); }}>
                   <Ionicons name="pin-outline" size={22} color="#475569" />
                   <Text style={styles.actionItemText}>Pin Message</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => { handleShareMessage(selectedMessage); setIsActionsVisible(false); }}>
                   <Ionicons name="share-social-outline" size={22} color="#475569" />
                   <Text style={styles.actionItemText}>Share</Text>
                </TouchableOpacity>

                {selectedMessage?.sender_id === authState.userId && selectedMessage?.content && (
                  <TouchableOpacity 
                    style={styles.actionItem} 
                    onPress={() => {
                      setIsEditing(true);
                      setEditContent(selectedMessage.content);
                      setIsActionsVisible(false);
                    }}
                  >
                    <Ionicons name="create-outline" size={22} color="#475569" />
                    <Text style={styles.actionItemText}>Edit Message</Text>
                  </TouchableOpacity>
                )}

                {selectedMessage?.sender_id === authState.userId && (
                  <TouchableOpacity 
                    style={[styles.actionItem, { borderBottomWidth: 0 }]} 
                    onPress={() => setIsDeleteOptionsVisible(true)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    <Text style={[styles.actionItemText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                )}
             </View>
          </GlassCard>
        </TouchableOpacity>
      </Modal>

      {/* --- DELETE OPTIONS MODAL --- */}
      <Modal
        visible={isDeleteOptionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteOptionsVisible(false)}
      >
        <View style={styles.deleteOptionsBackdrop}>
           <View style={styles.deleteOptionsCard}>
              <Text style={styles.deleteTitle}>Delete Message?</Text>
              
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteMessage('me')}>
                <Text style={styles.deleteBtnText}>Delete for me</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteMessage('everyone')}>
                <Text style={styles.deleteBtnText}>Delete for everyone</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.deleteBtn, { borderBottomWidth: 0, marginTop: 10 }]} 
                onPress={() => setIsDeleteOptionsVisible(false)}
              >
                <Text style={[styles.deleteBtnText, { color: '#64748B' }]}>Cancel</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarMini: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarTextMini: { color: '#FFF', fontWeight: '900', fontSize: 20 },
  titleWrapper: { flex: 1 },
  headerTitleText: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  statusRowHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  statusDotHeader: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusTextHeader: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  callBtnHeader: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  acceptBanner: {
    margin: 20,
    padding: 24,
    backgroundColor: '#0a7ea4',
    borderRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  acceptInfo: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  shieldIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  acceptTextWrapper: { flex: 1 },
  acceptBannerTitle: { color: '#FFF', fontWeight: '900', fontSize: 18, marginBottom: 2 },
  acceptBannerText: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 13 },
  acceptActionBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  acceptActionText: { color: '#0a7ea4', fontWeight: '900', fontSize: 15, textTransform: 'uppercase', letterSpacing: 0.5 },

  msgContainer: { marginBottom: 16, width: '100%' },
  doctorMsg: { alignItems: 'flex-end' },
  patientMsg: { alignItems: 'flex-start' },
  
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bubbleDoctor: {
    backgroundColor: "#0a7ea4",
    borderBottomRightRadius: 4,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  bubblePatient: {
    backgroundColor: "#E2E8F0",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  messageContent: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  msgImage: { width: 240, height: 180, borderRadius: 16, marginBottom: 8 },
  textDoctor: { color: "#FFF" },
  textPatient: { color: "#1E293B" },
  
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  timeText: { fontSize: 10, color: "rgba(0,0,0,0.4)", fontWeight: '800' },

  inputWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 35,
    paddingTop: 15,
  },
  inputOuterContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontWeight: '500',
  },
  attachmentBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendBtn: {
    backgroundColor: "#0a7ea4",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 2,
  },
  disabledBtn: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },

  lockedBar: {
    margin: 20,
    marginBottom: 40,
    padding: 24,
    backgroundColor: "#F1F5F9",
    borderRadius: 32,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  lockedText: { color: "#64748B", marginLeft: 12, fontWeight: "800", fontSize: 15 },

  // History Modal Styles
  historyModalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    height: '85%',
    width: '100%',
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyModalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
  historyItemCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  historyDate: { fontSize: 11, color: '#0369a1', fontWeight: '800' },
  historyDiagnosis: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  historyNotes: { fontSize: 14, color: '#475569', lineHeight: 20 },
  emptyHistory: { alignItems: 'center', marginTop: 80 },
  emptyHistoryText: { marginTop: 15, fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  historyFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  downloadBtnLarge: {
    backgroundColor: '#0a7ea4',
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  downloadBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },

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
  largePlaceholder: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  largePlaceholderText: { color: '#FFF', fontSize: 80, fontWeight: '900' },

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeAvatar: { width: '100%', height: '100%' },
  largeAvatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#0a7ea4', justifyContent: 'center', alignItems: 'center' },
  largeAvatarText: { color: '#FFF', fontSize: 44, fontWeight: '900' },
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

  // WhatsApp Style Send Preview
  sendPreviewContainer: { flex: 1, backgroundColor: '#000' },
  sendPreviewHeader: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  sendPreviewClose: { marginRight: 20 },
  sendPreviewTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  sendPreviewImageWrapper: { flex: 1, justifyContent: 'center' },
  sendPreviewImage: { width: '100%', height: '100%' },
  sendPreviewFooter: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  captionInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 30, 
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 15
  },
  captionInput: { flex: 1, color: '#FFF', fontSize: 16, maxHeight: 100 },
  sendImageBtn: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#0a7ea4', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // Message Actions Styles
  actionsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  actionsCard: { width: '80%', padding: 10, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.98)', overflow: 'hidden' },
  actionRow: { width: '100%' },
  actionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    gap: 12
  },
  actionItemText: { fontSize: 16, fontWeight: '700', color: '#475569' },
  
  // Pinning
  pinIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  pinText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  // Deleted & Edited
  deletedText: { color: '#94A3B8', fontStyle: 'italic' },
  editedText: { fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: '600' },
  
  // Editing UI
  editInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 24, 
    paddingHorizontal: 15,
    paddingVertical: 8,
    gap: 10
  },
  editInput: { flex: 1, color: '#1E293B', fontSize: 14, maxHeight: 100 },
  cancelEditBtn: { padding: 4 },
  saveEditBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  
  // Delete Popup
  deleteOptionsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  deleteOptionsCard: { width: '85%', padding: 25, borderRadius: 30, backgroundColor: '#FFF', alignItems: 'center', elevation: 20 },
  deleteTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
  deleteBtn: { 
    width: '100%', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9', 
    alignItems: 'center' 
  },
  deleteBtnText: { fontSize: 16, fontWeight: '800', color: '#EF4444' },
});
