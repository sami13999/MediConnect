import { StyledButton } from "@/components/ui/StyledButton";
import { StyledInput } from "@/components/ui/StyledInput";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { HelpModal } from "@/components/HelpModal";
import { useRouter } from "expo-router";
import { useAlert } from "@/context/AlertContext";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
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

export default function PatientProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [stats, setStats] = useState({ appointments: 0, records: 0 });

  const [profile, setProfile] = useState<any>({});

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    blood_group: "",
    allergies: "",
    emergency_contact: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/users/profile/");
      setProfile(res.data);
      setFormData({
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        phone_number: res.data.phone_number || "",
        address: res.data.address || "",
        blood_group: res.data.blood_group || "",
        allergies: res.data.allergies || "",
        emergency_contact: res.data.emergency_contact || "",
      });
      fetchStats();
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [apptRes, recordRes] = await Promise.all([
        api.get("/appointments/"),
        api.get("/medical_records/")
      ]);
      setStats({
        appointments: apptRes.data.length,
        records: recordRes.data.length
      });
    } catch (e) {
      console.log("Stats fetch error:", e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert({ title: "Permission Denied", message: "We need access to your gallery.", icon: "images-outline" });
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
      name: `profile_${Date.now()}.jpg`,
      type: "image/jpeg",
    });

    try {
      await api.patch("/users/profile/", uploadData, {
        headers: { 
          "Content-Type": "multipart/form-data" 
        },
        transformRequest: (data) => data, // Keep FormData as is
      });
      showAlert({ title: "Success", message: "Profile Picture Updated!", icon: "checkmark-circle-outline" });
      fetchProfile();
    } catch (error: any) {
      console.error("Upload Error:", error.response?.data || error.message);
      showAlert({ title: "Error", message: "Upload failed. Check if server allows Large Files.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      await api.patch("/users/profile/", formData);
      showAlert({ title: "Success", message: "Profile Updated!", icon: "checkmark-circle-outline" });
      setEditModalVisible(false);
      fetchProfile();
    } catch (error) {
      showAlert({ title: "Error", message: "Could not update profile.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showAlert({
      title: "Confirm Logout",
      message: "Are you sure you want to log out of the system?",
      icon: "log-out-outline",
      iconColor: "#EF4444",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: logout,
        },
      ],
    });
  };

  const avatarUrl = profile.profile_picture
    ? { uri: profile.profile_picture }
    : {
        uri: `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=0a7ea4&color=fff&size=200`,
      };

  const MenuItem = ({ icon, title, subtitle, onPress, color = "#1f2937" }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}>
        <Ionicons name={icon} size={20} color={color === "red" ? "#EF4444" : "#0a7ea4"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchProfile} tintColor="#FFF" />
        }
      >
        <LinearGradient
          colors={['#0a7ea4', '#004d66']}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setIsPreviewVisible(true)}
              >
                <Image source={avatarUrl} style={styles.avatar} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.camBtn} 
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{profile.first_name} {profile.last_name}</Text>
            <Text style={styles.userEmail}>{profile.email || "Patient ID: #8829"}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statsCard}>
                <Text style={styles.statsNumber}>{stats.appointments}</Text>
                <Text style={styles.statsLabelSmall}>Appointments</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsNumber}>{stats.records}</Text>
                <Text style={styles.statsLabelSmall}>Medical Records</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsNumber}>{profile.blood_group || "--"}</Text>
                <Text style={styles.statsLabelSmall}>Blood Group</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* MEDICAL ID CARD */}
          <View style={styles.idCard}>
            <View style={styles.idCardHeader}>
              <Text style={styles.idCardTitle}>Medical Passport</Text>
              <Ionicons name="heart-circle" size={24} color="#EF4444" />
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Blood Group</Text>
                <Text style={styles.statValue}>{profile.blood_group || "N/A"}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Emergency</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{profile.emergency_contact || "None"}</Text>
              </View>
            </View>

            <View style={styles.allergySection}>
              <Text style={styles.statLabel}>Current Allergies</Text>
              <Text style={styles.allergyValue}>{profile.allergies || "No allergies reported"}</Text>
            </View>
          </View>

          {/* SETTINGS MENU */}
          <Text style={styles.sectionLabel}>Account Settings</Text>
          <View style={styles.menuGroup}>
            <MenuItem 
              icon="person-outline" 
              title="Personal Information" 
              subtitle="Edit your name and contact details"
              onPress={() => setEditModalVisible(true)} 
            />
            <MenuItem 
              icon="help-circle-outline" 
              title="Help Center" 
              subtitle="FAQs and support guides"
              onPress={() => setHelpVisible(true)} 
            />
            <MenuItem 
              icon="shield-checkmark-outline" 
              title="Privacy Policy" 
              subtitle="Data protection & terms"
              onPress={() => router.push('/privacy')} 
            />
            <MenuItem 
              icon="log-out-outline" 
              title="Sign Out" 
              color="red"
              onPress={handleLogout} 
            />
          </View>
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
              <Text style={styles.previewSubTitle}>{profile.first_name} {profile.last_name}</Text>
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
            <Text style={styles.modalTitle}>Update Profile</Text>
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
            <StyledInput value={formData.phone_number} onChangeText={(t) => setFormData({...formData, phone_number: t})} placeholder="+92" keyboardType="numeric" />

            <Text style={styles.inputLabel}>Address</Text>
            <StyledInput value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})} placeholder="123 Health St, City" />
            
            <Text style={styles.inputLabel}>Blood Group</Text>
            <StyledInput value={formData.blood_group} onChangeText={(t) => setFormData({...formData, blood_group: t})} placeholder="O+" />

            <Text style={styles.inputLabel}>Allergies</Text>
            <StyledInput value={formData.allergies} onChangeText={(t) => setFormData({...formData, allergies: t})} placeholder="Peanuts, Penicillin..." multiline />

            <Text style={styles.inputLabel}>Emergency Contact</Text>
            <StyledInput value={formData.emergency_contact} onChangeText={(t) => setFormData({...formData, emergency_contact: t})} placeholder="+92 ..." keyboardType="numeric" />

            <View style={{ marginTop: 20 }}>
              <StyledButton title="Save Changes" onPress={updateProfile} isLoading={loading} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} role="patient" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { alignItems: 'center', paddingTop: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 4, 
    borderColor: 'rgba(255,255,255,0.3)' 
  },
  camBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#0a7ea4',
    padding: 8,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  userName: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  body: { paddingHorizontal: 20, marginTop: -30 },
  idCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  idCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  idCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },
  statLabel: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  allergySection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 },
  allergyValue: { fontSize: 14, color: '#4B5563', lineHeight: 20 },

  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginTop: 30, marginBottom: 15, marginLeft: 5 },
  menuGroup: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  passModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    elevation: 10
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 20 },
  cancelBtn: { padding: 10 },
  cancelBtnText: { color: '#6B7280', fontWeight: '600' },
  updateBtn: { backgroundColor: '#0a7ea4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  updateBtnText: { color: '#FFF', fontWeight: 'bold' },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },

  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statsLabelSmall: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
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
});

