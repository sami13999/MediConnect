import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function VideoCallScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams(); // id is the receiverId
  const { authState } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  // 1. Notify Backend / Log Call Start
  useEffect(() => {
    console.log(`[Consultation Mode] ${authState.role} started a call with ${name} (${id})`);
    
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleEndCall = async () => {
    const finalDuration = formatTime(duration);
    try {
      // 2. Post summary to Chat
      await api.post('/chat/messages/', {
        content: `Video call ended - ${finalDuration} mins`,
        receiver: id
      });
      Alert.alert("Call Ended", `Consultation duration: ${finalDuration}`);
      router.back();
    } catch (error) {
      console.error("Error ending call:", error);
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Remote Video (Full Screen Placeholder) */}
      <View style={styles.remoteVideo}>
        <View style={styles.remotePlaceholder}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={80} color="rgba(255,255,255,0.3)" />
          </View>
          <ThemedText type="title" style={styles.remoteName}>
            {name || 'Unknown User'}
          </ThemedText>
          <ThemedText style={styles.statusText}>{formatTime(duration)}</ThemedText>
          <View style={styles.modeBadge}>
            <Text style={styles.modeText}>CONSULTATION MODE</Text>
          </View>
          <ThemedText style={styles.connectionText}>End-to-end encrypted</ThemedText>
        </View>
      </View>

      {/* Local Video (Floating Window) */}
      <View style={styles.localVideo}>
        {!isVideoOff ? (
          <View style={styles.localPlaceholder} />
        ) : (
          <View style={[styles.localPlaceholder, { backgroundColor: '#333' }]}>
             <Ionicons name="videocam-off" size={24} color="#FFF" />
          </View>
        )}
      </View>

      {/* Control Bar */}
      <View style={styles.controlsContainer}>
        
        {/* Mute Toggle */}
        <TouchableOpacity 
          style={[styles.controlBtn, isMuted ? styles.activeBtn : styles.inactiveBtn]} 
          onPress={() => setIsMuted(!isMuted)}
        >
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? "#000" : "#FFF"} />
        </TouchableOpacity>

        {/* End Call */}
        <TouchableOpacity 
          style={[styles.controlBtn, styles.endCallBtn]} 
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={32} color="#FFF" />
        </TouchableOpacity>

        {/* Video Toggle */}
        <TouchableOpacity 
          style={[styles.controlBtn, isVideoOff ? styles.activeBtn : styles.inactiveBtn]} 
          onPress={() => setIsVideoOff(!isVideoOff)}
        >
          <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color={isVideoOff ? "#000" : "#FFF"} />
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  remoteVideo: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#2C2C2E' 
  },
  remotePlaceholder: { alignItems: 'center' },
  avatarLarge: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20
  },
  remoteName: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  statusText: { color: '#FFF', marginTop: 8, fontSize: 18, fontVariant: ['tabular-nums'] },
  modeBadge: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 15,
  },
  modeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  connectionText: { color: '#4ADE80', marginTop: 8, fontSize: 12, opacity: 0.8 },
  
  localVideo: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#000',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    elevation: 5
  },
  localPlaceholder: { flex: 1, backgroundColor: '#48484A', justifyContent: 'center', alignItems: 'center' },

  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center'
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeBtn: {
    backgroundColor: '#FFF',
  },
  endCallBtn: {
    backgroundColor: '#FF3B30',
    width: 70,
    height: 70,
    borderRadius: 35
  }
});

import { Text } from 'react-native';