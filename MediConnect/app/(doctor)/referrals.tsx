import { StyledButton } from "@/components/ui/StyledButton";
import { StyledInput } from "@/components/ui/StyledInput";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";

export default function SimpleReferralScreen() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const preSelectedId = params.preSelectedPatientId as string;

  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Data
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  // Selections
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        api.get("/chat/messages/my_patients/"),
        api.get(`/appointments/doctors/?exclude_id=${authState.userId}`),
      ]);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
      
      if (preSelectedId) {
        const found = patientsRes.data.find((p: any) => p.id.toString() === preSelectedId);
        if (found) setSelectedPatient(found);
      }
      setDataLoaded(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not load clinical data");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filteredDoctors = doctors.filter((doc) =>
    doc.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const handleSendReferral = async () => {
    if (!selectedPatient) return Alert.alert("Required", "Please select a patient.");
    if (!selectedDoctor) return Alert.alert("Required", "Please select a specialist doctor.");
    if (!reason.trim()) return Alert.alert("Required", "Please provide a clinical reason.");

    setLoading(true);
    try {
      await api.post("/appointments/referrals/", {
        target_doctor: selectedDoctor.id,
        patient: selectedPatient.id,
        reason: reason,
      });

      Alert.alert("Success", "Professional referral sent successfully.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to process referral.");
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#0a7ea4', '#004D66']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Professional Referral</Text>
            <Text style={styles.headerSub}>Inter-Specialist Consultation Link</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  if (loading && !dataLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Syncing Clinical Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />
      
      {renderHeader()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: PATIENT */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
             <Ionicons name="person-circle-outline" size={22} color="#0a7ea4" />
             <Text style={styles.sectionLabel}>Target Patient</Text>
          </View>
          
          {selectedPatient ? (
            <GlassCard style={styles.selectionCard} intensity={35}>
              <Image 
                source={{ uri: selectedPatient.profile_picture || `https://ui-avatars.com/api/?name=${selectedPatient.first_name}+${selectedPatient.last_name}&background=0a7ea4&color=fff` }}
                style={styles.selectedAvatar}
              />
              <View style={styles.selectedInfo}>
                 <Text style={styles.selectedName}>{selectedPatient.first_name} {selectedPatient.last_name}</Text>
                 <Text style={styles.selectedSub}>Patient ID: #{selectedPatient.id.toString().slice(0,8).toUpperCase()}</Text>
              </View>
              {!preSelectedId && (
                <TouchableOpacity onPress={() => setSelectedPatient(null)} style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          ) : (
            <View>
              <View style={styles.searchBoxForm}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <StyledInput 
                   placeholder="Search your patients..." 
                   value={patientSearch}
                   onChangeText={setPatientSearch}
                   containerStyle={styles.cleanInput}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                {filteredPatients.map(p => (
                  <TouchableOpacity key={p.id} onPress={() => setSelectedPatient(p)} style={styles.miniCard}>
                    <Image source={{ uri: p.profile_picture || `https://ui-avatars.com/api/?name=${p.first_name}+${p.last_name}&background=0a7ea4&color=fff` }} style={styles.miniAvatar} />
                    <Text style={styles.miniName} numberOfLines={1}>{p.first_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* SECTION 2: SPECIALIST */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
             <Ionicons name="medical-outline" size={22} color="#0ea5e9" />
             <Text style={styles.sectionLabel}>Receiving Specialist</Text>
          </View>

          {selectedDoctor ? (
            <GlassCard style={[styles.selectionCard, { borderColor: '#0ea5e9' }]} intensity={35}>
              <Image 
                source={{ uri: selectedDoctor.profile_picture || `https://ui-avatars.com/api/?name=${selectedDoctor.first_name}+${selectedDoctor.last_name}&background=0ea5e9&color=fff` }}
                style={styles.selectedAvatar}
              />
              <View style={styles.selectedInfo}>
                 <Text style={styles.selectedName}>Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</Text>
                 <Text style={[styles.selectedSub, { color: '#0ea5e9' }]}>{selectedDoctor.specialization}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDoctor(null)} style={styles.changeBtn}>
                <Text style={[styles.changeBtnText, { color: '#0ea5e9' }]}>Change</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <View>
              <View style={styles.searchBoxForm}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <StyledInput 
                   placeholder="Search specialists or departments..." 
                   value={doctorSearch}
                   onChangeText={setDoctorSearch}
                   containerStyle={styles.cleanInput}
                />
              </View>
              <View style={styles.doctorGrid}>
                 {filteredDoctors.slice(0, 6).map(doc => (
                   <TouchableOpacity key={doc.id} onPress={() => setSelectedDoctor(doc)} style={styles.docTile}>
                      <Image source={{ uri: doc.profile_picture || `https://ui-avatars.com/api/?name=${doc.first_name}+${doc.last_name}&background=0ea5e9&color=fff` }} style={styles.docTileAvatar} />
                      <Text style={styles.docTileName} numberOfLines={1}>Dr. {doc.last_name}</Text>
                      <Text style={styles.docTileSpec} numberOfLines={1}>{doc.specialization}</Text>
                   </TouchableOpacity>
                 ))}
              </View>
            </View>
          )}
        </View>

        {/* SECTION 3: REASON */}
        <View style={styles.section}>
           <View style={styles.sectionLabelRow}>
              <Ionicons name="document-text-outline" size={22} color="#64748B" />
              <Text style={styles.sectionLabel}>Clinical Context & Rationale</Text>
           </View>
           <StyledInput 
              placeholder="Explain why this patient needs a referral..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={6}
              containerStyle={styles.reasonInputForm}
           />
        </View>

        <StyledButton 
          title="Complete & Send Referral"
          onPress={handleSendReferral}
          isLoading={loading}
          style={styles.submitBtn}
        />
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#64748B', fontWeight: '600' },
  
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  safeHeader: { paddingHorizontal: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: 'white' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  
  scrollContent: { padding: 24 },
  section: { marginBottom: 32 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 1 },
  
  selectionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 24, 
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#0a7ea4',
  },
  selectedAvatar: { width: 50, height: 50, borderRadius: 15, marginRight: 15 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  selectedSub: { fontSize: 12, color: '#64748B', fontWeight: '700', marginTop: 2 },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  changeBtnText: { fontSize: 12, fontWeight: '800', color: '#0a7ea4' },
  
  searchBoxForm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 15,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 54,
    marginBottom: 15,
  },
  cleanInput: { flex: 1, borderWidth: 0, shadowOpacity: 0, elevation: 0, backgroundColor: 'transparent', height: '100%' },
  
  horizontalList: { marginHorizontal: -10 },
  miniCard: { alignItems: 'center', width: 80, marginHorizontal: 5 },
  miniAvatar: { width: 60, height: 60, borderRadius: 20, marginBottom: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  miniName: { fontSize: 12, fontWeight: '700', color: '#475569' },
  
  doctorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  docTile: { 
    width: '48%', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 12, 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  docTileAvatar: { width: 50, height: 50, borderRadius: 15, marginBottom: 8 },
  docTileName: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
  docTileSpec: { fontSize: 11, color: '#0ea5e9', fontWeight: '700', marginTop: 2 },
  
  reasonInputForm: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 5,
    height: 150,
  },
  submitBtn: { height: 62, borderRadius: 20, marginTop: 10, shadowColor: '#0a7ea4', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
});
