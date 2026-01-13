import { useRouter } from "expo-router";
import api from "@/services/api";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyledInput } from "@/components/ui/StyledInput";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";

// Anchor layout for nested navigation
export const unstable_settings = {
  initialRouteName: "index",
};

export default function DoctorMessages() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/chat/messages/my_patients/");
      setPatients(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPatients = patients.filter((p: any) =>
    p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative background elements */}
      <View style={[styles.decorCircle, { top: 150, left: -100, backgroundColor: '#0ea5e9', opacity: 0.05 }]} />
      <View style={[styles.decorCircle, { bottom: 100, right: -120, backgroundColor: '#22d3ee', opacity: 0.08 }]} />

      <LinearGradient
        colors={['#0a7ea4', '#003d52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.safeHeader} edges={['top']}>
          <View style={styles.headerTopRow}>
            <Text style={styles.premiumHeader}>Patients</Text>
          </View>
          
          <View style={styles.searchWrapper}>
            <View style={styles.searchGlass}>
              <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
              <TextInput
                placeholder="Search"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.cleanSearchInput}
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            {["All", "Unread", "Favourites", "Groups"].map((filter) => (
              <TouchableOpacity 
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchChats} 
            tintColor="#0a7ea4"
          />
        }
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#CBD5E1" />
            <Text style={styles.empty}>No active conversations yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/(doctor)/chat_room",
                  params: { 
                    receiverId: item.id, 
                    receiverName: `${item.first_name} ${item.last_name}`,
                    receiverAvatar: item.profile_picture || "",
                  },
                })
              }
              style={styles.chatListItem}
            >
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedProfile(item);
                  setIsPreviewVisible(true);
                }}
                style={styles.avatarContainer}
              >
                {item.profile_picture ? (
                  <Image 
                    source={{ uri: item.profile_picture.startsWith('http') ? item.profile_picture : `${(process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0]}${item.profile_picture}` }} 
                    style={styles.avatarImg} 
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item.first_name[0]}{item.last_name[0]}</Text>
                  </View>
                )}
                {item.is_accepted && <View style={styles.onlineDot} />}
              </TouchableOpacity>

              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName} numberOfLines={1}>{item.first_name} {item.last_name}</Text>
                  <Text style={styles.chatTime}>12/01/2026</Text>
                </View>
                <View style={styles.chatSubRow}>
                  <Text style={styles.chatSnippet} numberOfLines={1}>
                    {item.is_accepted ? "Hi, I need medical advice regarding my prescription..." : "New consultation request waiting..."}
                  </Text>
                  {item.is_accepted && <Ionicons name="pin" size={16} color="#94A3B8" style={{ transform: [{ rotate: '45deg' }] }} />}
                </View>
              </View>
            </TouchableOpacity>
        )}
      />
      

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
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.previewHeaderInfo}>
              <Text style={styles.previewTitle}>Profile Photo</Text>
              <Text style={styles.previewSubTitle}>{selectedProfile ? `${selectedProfile.first_name} ${selectedProfile.last_name}` : ""}</Text>
            </View>
          </SafeAreaView>
          <View style={styles.previewContent}>
             {selectedProfile?.profile_picture ? (
                <Image 
                  key={selectedProfile.profile_picture}
                  source={{ uri: selectedProfile.profile_picture.startsWith('http') ? selectedProfile.profile_picture : `${(process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0]}${selectedProfile.profile_picture}` }} 
                  style={styles.fullImage} 
                  resizeMode="contain" 
                />
              ) : (
                <View style={styles.largePlaceholder}>
                   <Text style={styles.largePlaceholderText}>
                     {selectedProfile ? `${selectedProfile.first_name[0]}${selectedProfile.last_name[0]}` : "P"}
                   </Text>
                </View>
              )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  decorCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  headerGradient: {
    paddingBottom: 25,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  safeHeader: { paddingHorizontal: 20, paddingTop: 10 },
  premiumHeader: { fontSize: 28, fontWeight: "900", color: "#FFF", letterSpacing: -0.5 },
  
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  headerIcons: { flexDirection: 'row', gap: 20 },
  iconBtn: { padding: 5 },

  searchWrapper: { marginTop: 15 },
  searchGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 54,
  },
  searchIcon: { marginRight: 5 },
  cleanSearchInput: { flex: 1, color: '#FFF', fontSize: 16, marginLeft: 10 },
  
  filterRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  filterChip: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  filterText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#FFF' },

  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.4)',
  },
  avatarContainer: { position: 'relative' },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0a7ea4', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  
  chatInfo: { flex: 1, marginLeft: 15 },
  chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  chatTime: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  
  chatSubRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  chatSnippet: { fontSize: 14, color: '#64748B', fontWeight: '500', flex: 1, marginRight: 10 },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  empty: { textAlign: "center", marginTop: 20, color: "#94A3B8", fontSize: 18, fontWeight: '700' },

  // Preview Modal Styles
  previewBackdrop: { flex: 1, backgroundColor: '#000' },
  previewHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  previewClose: { marginRight: 20 },
  previewHeaderInfo: { flex: 1 },
  previewTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  previewSubTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  previewContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '80%' },
  largePlaceholder: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  largePlaceholderText: { color: '#FFF', fontSize: 80, fontWeight: '900' },
});
