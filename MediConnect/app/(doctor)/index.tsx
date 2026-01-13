import { StyledButton } from "@/components/ui/StyledButton";
import { StyledInput } from "@/components/ui/StyledInput";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";

export default function DoctorDashboard() {
  const { authState } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [profile, setProfile] = useState<any>(null);
  
  // Verification Logic
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // REAL STATS
  const [stats, setStats] = useState({
    total_patients: 0,
    total_appointments: 0,
    pending_requests: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/appointments/");
      const data = res.data;
      setAppointments(data);

      const statsRes = await api.get("/users/doctor-stats/");
      setStats(statsRes.data);

      const profileRes = await api.get("/users/profile/");
      setProfile(profileRes.data);

    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  const openPrescribeModal = (appointment: any) => {
    setSelectedPatient(appointment);
    setModalVisible(true);
  };

  const openVerificationModal = (appointment: any) => {
    if (appointment.payment_receipt) {
      setSelectedReceipt(appointment.payment_receipt);
      setVerifyingId(appointment.id);
      setVerificationModalVisible(true);
    } else {
      Alert.alert("No Receipt", "Patient has not uploaded a payment receipt.");
    }
  };

  const updateStatus = async (id: number, status: string) => {
    // ✅ Optimistic Update
    const previousAppointments = [...appointments];
    setAppointments((prev: any) => 
      prev.map((a: any) => a.id === id ? { ...a, status } : a)
    );

    try {
      await api.post(`/appointments/${id}/update_status/`, { status });
      fetchData(); // Sync with server
    } catch (error) {
      setAppointments(previousAppointments); // Rollback
      Alert.alert("Error", "Failed to update status");
    }
  };

  const submitRecord = async () => {
    if (!diagnosis || !prescription) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    try {
      await api.post("/medical_records/", {
        patient: selectedPatient.patient,
        diagnosis: diagnosis,
        prescription: prescription,
        notes: "Appointment Completed",
      });
      Alert.alert("Success", "Prescription Sent!");
      setModalVisible(false);
      setDiagnosis("");
      setPrescription("");
      fetchData();
    } catch (error) {
      Alert.alert("Error", "Failed to save record");
    }
  };

  // Determine the next upcoming appointment
  const upNextAppointment = appointments
    .filter((a: any) => a.status === 'confirmed' || a.status === 'pending')
    .sort((a: any, b: any) => a.time.localeCompare(b.time))[0];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.decorCircle, { top: -100, left: -50, backgroundColor: '#0ea5e9', opacity: 0.1 }]} />
      <View style={[styles.decorCircle, { bottom: 100, right: -100, backgroundColor: '#06b6d4', opacity: 0.08 }]} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#0a7ea4" />
        }
      >
        <View style={styles.stickyHeaderContainer}>
            <LinearGradient
                colors={['#0a7ea4', '#004d66']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView style={styles.safeHeader}>
                    <View style={styles.headerTop}>
                        <View style={styles.profileInfo}>
                            <TouchableOpacity 
                                onPress={() => router.push("/(doctor)/profile")}
                                style={styles.avatarBorder}
                            >
                                {profile?.profile_picture ? (
                                    <Image 
                                        source={{ uri: profile.profile_picture.startsWith('http') ? profile.profile_picture : `${(process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0]}${profile.profile_picture}` }}
                                        style={styles.docAvatarImg} 
                                    />
                                ) : (
                                    <View style={styles.docAvatar}>
                                        <Text style={styles.avatarInitial}>{profile?.first_name ? profile.first_name[0] : 'D'}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <View style={{ marginLeft: 15 }}>
                                <Text style={styles.welcomeTitle}>Good Morning,</Text>
                                <Text style={styles.docNameText}>Dr. {profile?.first_name || 'Specialist'}</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.iconBtn}>
                                <Ionicons name="notifications-outline" size={24} color="#FFF" />
                                <View style={styles.notifDot} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>

        <View style={styles.body}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                {[
                    { label: 'Patient Count', val: stats.total_patients, icon: 'people', color1: '#0ea5e9', color2: '#2563eb' },
                    { label: 'Revenue (M-T-D)', val: `$${stats.revenue}`, icon: 'wallet', color1: '#10b981', color2: '#059669' },
                    { label: 'Pending', val: stats.pending_requests, icon: 'time', color1: '#f59e0b', color2: '#d97706' },
                    { label: 'Appointments', val: stats.total_appointments, icon: 'calendar', color1: '#8b5cf6', color2: '#7c3aed' },
                ].map((s, i) => (
                    <LinearGradient
                        key={i}
                        colors={[s.color1, s.color2]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                    >
                        <View style={styles.statIconCircle}>
                            <Ionicons name={s.icon as any} size={20} color="#FFF" />
                        </View>
                        <Text style={styles.statBigVal}>{s.val}</Text>
                        <Text style={styles.statSmallLabel}>{s.label}</Text>
                    </LinearGradient>
                ))}
            </ScrollView>

            {upNextAppointment && (
                <View style={styles.upNextContainer}>
                    <Text style={styles.sectionTitle}>Immediate Duty</Text>
                    <GlassCard style={styles.heroCard} intensity={40}>
                        <View style={styles.heroLayout}>
                            <View style={styles.heroLeft}>
                                <Text style={styles.heroTimeLabel}>Next Appointment</Text>
                                <Text style={styles.heroTimeText}>{upNextAppointment.time.slice(0, 5)}</Text>
                                <Text style={styles.heroSubText}>with {upNextAppointment.patient_name}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.heroCallBtn}
                                onPress={() => router.push({ pathname: '/communication/videocall', params: { id: upNextAppointment.patient, name: upNextAppointment.patient_name }})}
                            >
                                <LinearGradient colors={['#FFF', '#F1F5F9']} style={styles.heroBtnInner}>
                                    <Ionicons name="videocam" size={20} color="#0a7ea4" />
                                    <Text style={styles.heroBtnText}>Join Call</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </View>
            )}

            <View style={styles.listSection}>
                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>Daily Schedule</Text>
                    <TouchableOpacity onPress={fetchData}>
                        <Text style={{ color: '#0a7ea4', fontWeight: '700' }}>See All</Text>
                    </TouchableOpacity>
                </View>

                {appointments.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="medical-outline" size={60} color="#CBD5E1" />
                        <Text style={styles.emptyTxt}>No bookings for today.</Text>
                    </View>
                ) : (
                    appointments.map((item: any) => (
                        <View key={item.id} style={styles.apptCard}>
                            {/* Left Status Bar */}
                            <View style={[styles.cardAccent, { backgroundColor: item.status === 'confirmed' ? '#10B981' : '#F59E0B' }]} />
                            
                            <View style={styles.cardMain}>
                                {/* Top Row: Name & Time/Date */}
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardPatientName}>{item.patient_name || "Patient"}</Text>
                                    <Text style={styles.cardTimeDateText}>
                                        {item.time ? item.time.slice(0, 5) : "--:--"} • {item.date ? item.date.slice(5).replace('-', '/') : ""}
                                    </Text>
                                </View>

                                {/* Reason Row */}
                                <Text style={styles.cardReasonText}>{item.reason || "Consultation Booking"}</Text>

                                {/* Footer Row: Status & Actions */}
                                <View style={styles.cardFooter}>
                                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'confirmed' ? '#DCFCE7' : '#FEF3C7' }]}>
                                        <Text style={[styles.statusBadgeText, { color: item.status === 'confirmed' ? '#166534' : '#92400E' }]}>
                                            {item.status.toUpperCase()}
                                        </Text>
                                    </View>

                                    <View style={styles.actionRow}>
                                        {item.status === 'pending' && (
                                            <>
                                                <TouchableOpacity 
                                                    style={[styles.miniActionBtn, { backgroundColor: '#10B981' }]}
                                                    onPress={() => updateStatus(item.id, 'confirmed')}
                                                >
                                                    <Ionicons name="checkmark" size={18} color="#FFF" />
                                                </TouchableOpacity>
                                                
                                                <TouchableOpacity 
                                                    style={[styles.miniActionBtn, { backgroundColor: '#EF4444' }]}
                                                    onPress={() => updateStatus(item.id, 'cancelled')}
                                                >
                                                    <Ionicons name="close" size={18} color="#FFF" />
                                                </TouchableOpacity>
                                            </>
                                        )}

                                        {item.status === 'pending' && item.payment_receipt && (
                                            <TouchableOpacity 
                                                style={[styles.miniActionBtn, { backgroundColor: '#8B5CF6', width: 'auto', paddingHorizontal: 12 }]}
                                                onPress={() => openVerificationModal(item)}
                                            >
                                                <Ionicons name="receipt-outline" size={18} color="#FFF" />
                                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold', marginLeft: 4 }}>Verify Pay</Text>
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity 
                                            style={styles.prescribeBtn}
                                            onPress={() => openPrescribeModal(item)}
                                        >
                                            <Ionicons name="create-outline" size={18} color="#FFF" />
                                            <Text style={styles.prescribeBtnText}>Prescribe</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>
            <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* PRESCRIBE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBody}>
            <View style={styles.modalHead}>
              <Text style={styles.modalHeadTitle}>Create Prescription</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.ptDetailsLabel}>Patient: <Text style={{ fontWeight: 'bold' }}>{selectedPatient?.patient_name}</Text></Text>
            
            <View style={styles.inputGap}>
              <StyledInput
                placeholder="Final Diagnosis"
                value={diagnosis}
                onChangeText={setDiagnosis}
                icon="flask-outline"
              />
              <StyledInput
                placeholder="Prescribed Medicine / Instructions"
                value={prescription}
                onChangeText={setPrescription}
                icon="document-text-outline"
                multiline
              />
            </View>

            <TouchableOpacity style={styles.submitFullBtn} onPress={submitRecord}>
              <Text style={styles.submitFullBtnText}>Confirm & Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VERIFICATION MODAL */}
      <Modal visible={verificationModalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBody}>
             <View style={styles.modalHead}>
               <Text style={styles.modalHeadTitle}>Verify Payment</Text>
               <TouchableOpacity onPress={() => setVerificationModalVisible(false)}>
                 <Ionicons name="close" size={24} color="#111827" />
               </TouchableOpacity>
             </View>

             <View style={styles.receiptContainer}>
                {selectedReceipt ? (
                    <Image 
                      source={{ uri: selectedReceipt.startsWith('http') ? selectedReceipt : `${process.env.EXPO_PUBLIC_API_URL?.split('/api')[0]}${selectedReceipt}` }} 
                      style={styles.receiptImg} 
                      resizeMode="contain" 
                    />
                ) : (
                    <Text>No Receipt Image</Text>
                )}
             </View>

             <View style={styles.actionRowFull}>
                <TouchableOpacity 
                   style={[styles.verifyBtn, { backgroundColor: '#EF4444' }]}
                   onPress={() => {
                       if (verifyingId) updateStatus(verifyingId, 'cancelled');
                       setVerificationModalVisible(false);
                   }}
                >
                    <Ionicons name="close-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.verifyBtnText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                   style={[styles.verifyBtn, { backgroundColor: '#10B981', flex: 2 }]}
                   onPress={() => {
                        if (verifyingId) updateStatus(verifyingId, 'confirmed');
                        setVerificationModalVisible(false);
                   }}
                >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.verifyBtnText}>Confirm (Received)</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  decorCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  stickyHeaderContainer: { backgroundColor: '#F9FAFB', zIndex: 10 },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
  },
  safeHeader: { },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  docAvatarImg: { width: '100%', height: '100%' },
  docAvatar: { width: '100%', height: '100%', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#0a7ea4', fontWeight: '900', fontSize: 20 },
  welcomeTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  docNameText: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { 
    width: 44, height: 44, borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  notifDot: { 
    position: 'absolute', top: 12, right: 14, 
    width: 8, height: 8, borderRadius: 4, 
    backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#0a7ea4' 
  },

  body: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 15 },
  statsScroll: { gap: 12, paddingRight: 20, marginBottom: 30 },
  statCard: {
    width: 140,
    padding: 16,
    borderRadius: 24,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  statBigVal: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  statSmallLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  upNextContainer: { marginBottom: 30 },
  heroCard: { 
    borderRadius: 30, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderWidth: 1, 
    borderColor: 'rgba(10, 126, 164, 0.2)',
    padding: 20,
  },
  heroLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flex: 1 },
  heroTimeLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 },
  heroTimeText: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  heroSubText: { fontSize: 14, fontWeight: '600', color: '#0a7ea4' },
  heroCallBtn: { 
    borderRadius: 20, 
    overflow: 'hidden', 
    shadowColor: "#0a7ea4", 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 8 
  },
  heroBtnInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 8 },
  heroBtnText: { color: '#0a7ea4', fontWeight: '900', fontSize: 14 },

  listSection: { flex: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  
  apptCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardAccent: { width: 8 },
  cardMain: { flex: 1, padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardPatientName: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  cardTimeDateText: { fontSize: 13, fontWeight: '700', color: '#0a7ea4' },
  cardReasonText: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  
  actionRow: { flexDirection: 'row', gap: 8 },
  miniActionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  prescribeBtn: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#0a7ea4', 
    paddingHorizontal: 14, borderRadius: 12, gap: 6 
  },
  prescribeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  emptyContainer: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyTxt: { fontSize: 14, fontWeight: '600', color: '#64748B', marginTop: 10 },

  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalBody: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, paddingBottom: 40 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalHeadTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  ptDetailsLabel: { fontSize: 16, color: '#475569', marginBottom: 20 },
  inputGap: { gap: 15 },
  submitFullBtn: { backgroundColor: '#0a7ea4', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 30, shadowColor: "#0a7ea4", shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  submitFullBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  
  receiptContainer: {
    height: 300,
    backgroundColor: '#F1F5F9',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  receiptImg: { width: '100%', height: '100%' },
  actionRowFull: { flexDirection: 'row', gap: 15 },
  verifyBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  verifyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});

