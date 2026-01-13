import { StyledButton } from "@/components/ui/StyledButton";
import { StyledInput } from "@/components/ui/StyledInput";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { HelpModal } from "@/components/HelpModal";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";

export default function DoctorProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>({ total_patients: 0 });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    specialization: "",
    hospital_name: "",
    experience_years: "",
    bio: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/users/profile/");
      setProfile(res.data);
      
      // Fetch Stats
      const statRes = await api.get("/users/doctor-stats/");
      setStats(statRes.data);

      setFormData({
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        phone_number: res.data.phone_number || "",
        specialization: res.data.specialization || "",
        hospital_name: res.data.hospital_name || "",
        experience_years: res.data.experience_years
          ? String(res.data.experience_years)
          : "",
        bio: res.data.bio || "",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need access to your gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadProfilePicture(result.assets[0]);
    }
  };

  const uploadProfilePicture = async (imageAsset: any) => {
    const uploadData = new FormData();
    // @ts-ignore
    uploadData.append("profile_picture", {
      uri: Platform.OS === "android" ? imageAsset.uri : imageAsset.uri.replace("file://", ""),
      name: `doctor_profile_${Date.now()}.jpg`,
      type: "image/jpeg",
    });

    try {
      await api.patch("/users/profile/", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: (data) => data,
      });
      Alert.alert("Success", "Profile Picture Updated!");
      fetchProfile();
    } catch (error: any) {
      console.error("Upload Error:", error.response?.data || error.message);
      Alert.alert("Error", "Upload failed. Image might be too large.");
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        experience_years: parseInt(formData.experience_years) || 0,
      };
      await api.patch("/users/profile/", payload);
      Alert.alert("Success", "Profile Updated!");
      setEditModalVisible(false);
      fetchProfile();
    } catch (error) {
      Alert.alert("Error", "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of the system?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  const MenuItem = ({ icon, title, subtitle, onPress, color = "#1e293b" }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.menuIconBox}>
        <Ionicons name={icon} size={20} color={color === "red" ? "#EF4444" : "#0a7ea4"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );

  const avatarUrl = profile.profile_picture
    ? { uri: profile.profile_picture.startsWith('http') ? profile.profile_picture : `${(process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0]}${profile.profile_picture}` }
    : {
        uri: `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=FFF&color=0a7ea4&size=200`,
      };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative background elements */}
      <View style={[styles.decorCircle, { top: 200, right: -150, backgroundColor: '#0ea5e9', opacity: 0.05 }]} />
      <View style={[styles.decorCircle, { bottom: -50, left: -100, backgroundColor: '#22d3ee', opacity: 0.08 }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchProfile} tintColor="#FFF" />
        }
      >
        <LinearGradient
          colors={['#0a7ea4', '#003d52']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent} edges={['top']}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarGlow} />
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setIsPreviewVisible(true)}
              >
                <Image source={avatarUrl} style={styles.avatar} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={pickImage}
                activeOpacity={0.85}
                style={styles.camBtnWrapper}
              >
                <LinearGradient
                  colors={['#0ea5e9', '#0284c7']}
                  style={styles.camBtn}
                >
                  <Ionicons name="camera" size={16} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.docNameTitle}>Dr. {profile.first_name} {profile.last_name}</Text>
            <Text style={styles.docSpecTitle}>{profile.specialization || "General Specialist"}</Text>
            
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{profile.average_rating || "4.8"}</Text>
              <Text style={styles.ratingLabel}> Surgeon</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <GlassCard style={styles.infoCard} intensity={30}>
            <View style={styles.statsGrid}>
              <View style={styles.statUnit}>
                <Text style={styles.statLabel}>Patients</Text>
                <Text style={styles.statVal}>{stats.total_patients}+</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statUnit}>
                <Text style={styles.statLabel}>Experience</Text>
                <Text style={styles.statVal}>{profile.experience_years || 0}+ Years</Text>
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={styles.bioHeading}>About Doctor</Text>
              <Text style={styles.bioText}>
                {profile.bio || "Professional healthcare provider committed to delivering exceptional patient care and medical expertise."}
              </Text>
            </View>
          </GlassCard>

          <Text style={styles.sectionHeading}>Practice Settings</Text>
          <GlassCard style={styles.menuGroup} intensity={20}>
            <MenuItem 
              icon="create-outline" 
              title="Work Preferences" 
              subtitle="Hospital, Fees, Specialization"
              onPress={() => setEditModalVisible(true)} 
            />
            <MenuItem 
              icon="help-buoy-outline" 
              title="Provider Support" 
              onPress={() => setHelpVisible(true)} 
            />
            <MenuItem 
              icon="shield-checkmark-outline" 
              title="Privacy & Policy" 
              subtitle="Data protection & terms"
              onPress={() => router.push('/privacy')} 
            />
            <MenuItem 
              icon="log-out-outline" 
              title="Logout System" 
              color="red"
              onPress={handleLogout} 
            />
          </GlassCard>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

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
              <Text style={styles.previewSubTitle}>Dr. {profile.first_name} {profile.last_name}</Text>
            </View>
            <TouchableOpacity onPress={pickImage} style={styles.previewEdit}>
              <Ionicons name="create-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.previewContent}>
            <Image source={avatarUrl} style={styles.fullImage} resizeMode="contain" />
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Practice Details</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <Text style={styles.inputLabel}>First Name</Text>
            <StyledInput value={formData.first_name} onChangeText={(t) => setFormData({...formData, first_name: t})} placeholder="John" />

            <Text style={styles.inputLabel}>Last Name</Text>
            <StyledInput value={formData.last_name} onChangeText={(t) => setFormData({...formData, last_name: t})} placeholder="Doe" />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <StyledInput value={formData.phone_number} onChangeText={(t) => setFormData({...formData, phone_number: t})} placeholder="+1234567890" keyboardType="phone-pad" />

            <Text style={styles.inputLabel}>Specialization</Text>
            <StyledInput value={formData.specialization} onChangeText={(t) => setFormData({...formData, specialization: t})} placeholder="E.g. Cardiologist" />
            
            <Text style={styles.inputLabel}>Hospital / Clinic</Text>
            <StyledInput value={formData.hospital_name} onChangeText={(t) => setFormData({...formData, hospital_name: t})} placeholder="City Hospital" />

            <Text style={styles.inputLabel}>Years of Experience</Text>
            <StyledInput value={formData.experience_years} onChangeText={(t) => setFormData({...formData, experience_years: t})} placeholder="5" keyboardType="numeric" />
            
            <Text style={styles.inputLabel}>Biography</Text>
            <StyledInput value={formData.bio} onChangeText={(t) => setFormData({...formData, bio: t})} placeholder="Tell us about yourself..." multiline />

            <View style={{ marginTop: 20 }}>
              <StyledButton title="Update Changes" onPress={updateProfile} isLoading={loading} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} role="doctor" />

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
              <Text style={styles.previewSubTitle}>{profile?.first_name} {profile?.last_name}</Text>
            </View>
          </SafeAreaView>
          <View style={styles.previewContent}>
             {profile?.profile_picture ? (
                <Image 
                  key={profile.profile_picture}
                  source={{ uri: profile.profile_picture.startsWith('http') ? profile.profile_picture : `${(process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0]}${profile.profile_picture}` }} 
                  style={styles.fullImage} 
                  resizeMode="contain" 
                />
              ) : (
                <View style={styles.largePlaceholder}>
                   <Ionicons name="person" size={100} color="#FFF" />
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
    paddingBottom: 60,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  headerContent: { alignItems: 'center', paddingTop: 30 },
  avatarWrapper: { position: 'relative', marginBottom: 20 },
  avatarGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    top: -10,
    left: -10,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 4, 
    borderColor: '#FFF' 
  },
  camBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  docNameTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  docSpecTitle: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 6, 
    fontWeight: '800', 
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingText: { color: '#FBBF24', fontWeight: '900', fontSize: 14, marginLeft: 6 },
  ratingLabel: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  body: { paddingHorizontal: 20, marginTop: -40 },
  infoCard: {
    padding: 0, 
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  statUnit: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9' },
  statLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: '800' },
  statVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  
  bioSection: { 
    padding: 24, 
    backgroundColor: '#F8FAFC', 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bioHeading: { fontSize: 12, fontWeight: '800', color: '#0a7ea4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  bioText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },

  sectionHeading: { 
    fontSize: 13, 
    fontWeight: '900', 
    color: '#64748B', 
    textTransform: 'uppercase', 
    marginTop: 35, 
    marginBottom: 15, 
    marginLeft: 10,
    letterSpacing: 1.2
  },
  menuGroup: { 
    padding: 0,
    borderRadius: 32, 
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
  sectionHeadingModal: { fontSize: 18, fontWeight: '800', color: '#0a7ea4', marginBottom: 10 },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  menuSub: { fontSize: 12, color: '#94A3B8', marginTop: 3, fontWeight: '600' },

  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0a7ea4', letterSpacing: -0.5 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10, marginTop: 15, marginLeft: 2 },
  
  camBtnWrapper: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },

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
  previewEdit: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  previewContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '80%' },
  largePlaceholder: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  largePlaceholderText: { color: '#FFF', fontSize: 60, fontWeight: '900' },
});
