import { StyledButton } from "@/components/ui/StyledButton";
import api from "@/services/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useAlert } from "@/context/AlertContext";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps-outline' },
  { id: 'cardio', name: 'Cardiology', icon: 'heart-outline' },
  { id: 'dentist', name: 'Dentist', icon: 'medical-outline' },
  { id: 'neuro', name: 'Neurology', icon: 'flash-outline' },
  { id: 'ortho', name: 'Orthopedic', icon: 'body-outline' },
];

export default function PatientDashboard() {
  const { authState } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [symptomModalVisible, setSymptomModalVisible] = useState(false);
  const [symptoms, setSymptoms] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // 🔍 DEBOUNCED SEARCH EFFECT
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setFilteredDoctors(doctors);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    try {
      const res = await api.get(`/appointments/doctors/?search=${query}`);
      setFilteredDoctors(res.data);
    } catch (error) {
      console.error("Search Error:", error);
    }
  };

  const matchSymptoms = async () => {
    if (!symptoms.trim()) return;
    try {
      const res = await api.get(`/appointments/doctors/recommend/?symptoms=${symptoms}`);
      setFilteredDoctors(res.data);
      setSymptomModalVisible(false);
      showAlert({ title: "Success", message: `Found ${res.data.length} specialists matching your symptoms!`, icon: "checkmark-circle-outline" });
    } catch (error: any) {
      showAlert({ title: "No Match", message: error.response?.data?.detail || "Could not find a specific match.", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const docs = await api.get("/appointments/doctors/");
      setDoctors(docs.data);
      setFilteredDoctors(docs.data);
      const records = await api.get("/medical_records/");
      setMedicalRecords(records.data);

      const refs = await api.get("/appointments/referrals/");
      setReferrals(refs.data.filter((r: any) => r.status === 'pending'));
    } catch (error: any) {
      if (error.response?.data?.code === "token_not_valid") {
        console.log("Token expired");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const filterByCategory = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter((doc: any) => 
        doc.specialization?.toLowerCase().includes(category.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#0a7ea4" />
        }
      >
        {/* PREMIUM HEADER WITH GRADIENT */}
        <LinearGradient
          colors={['#0a7ea4', '#004d66']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greetingText}>
                  Hello, {authState.role === "patient" ? "Patient" : "Guest"} 👋
                </Text>
                <Text style={styles.headerSubtitle}>
                  How are you feeling today?
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(patient)/profile")}
                style={styles.profileAvatar}
              >
                <Ionicons name="person" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* REAL SEARCH AREA */}
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput 
                  placeholder="Search doctors, hospitals..."
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity 
                style={styles.symptomBtn}
                onPress={() => setSymptomModalVisible(true)}
              >
                <Ionicons name="flask" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* 🎫 REFERRAL TICKET SECTION */}
          {referrals.length > 0 && (
            <View style={styles.referralContainer}>
              <Text style={styles.sectionTitle}>Active Referrals</Text>
              {referrals.map((ref: any) => (
                <LinearGradient
                  key={ref.id}
                  colors={['#f0f9ff', '#e0f2fe']}
                  style={styles.referralCard}
                >
                  <View style={styles.referralHeader}>
                    <View style={styles.ticketIcon}>
                      <Ionicons name="medical" size={20} color="#0369a1" />
                    </View>
                    <Text style={styles.referralTitle}>Referral Ticket</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>PENDING</Text>
                    </View>
                  </View>

                  <View style={styles.referralContent}>
                    <Text style={styles.refInfo}>
                      <Text style={{ fontWeight: 'bold' }}>Dr. {ref.source_doctor_name}</Text> referred you to:
                    </Text>
                    <Text style={styles.targetDoctor}>
                      Dr. {ref.target_doctor_name}
                    </Text>
                    <Text style={styles.targetSpec}>{ref.target_doctor_specialization}</Text>
                    
                    <View style={styles.refReasonBox}>
                      <Text style={styles.refReasonLabel}>REASON:</Text>
                      <Text style={styles.refReasonText} numberOfLines={2}>{ref.reason}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.bookNowBtn}
                    onPress={() => router.push({
                      pathname: "/(patient)/book_appointment",
                      params: { 
                        id: ref.target_doctor,
                        name: ref.target_doctor_name,
                        fee: '2000', 
                      }
                    })}
                  >
                    <Text style={styles.bookNowText}>Book Appointment Now</Text>
                    <Ionicons name="chevron-forward" size={18} color="white" />
                  </TouchableOpacity>
                </LinearGradient>
              ))}
            </View>
          )}

          {/* CATEGORIES CHIPS */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => filterByCategory(cat.id)}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive
                ]}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={18} 
                  color={selectedCategory === cat.id ? "#FFF" : "#0a7ea4"} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* DOCTORS SECTION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Specialists</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>

          {refreshing && filteredDoctors.length === 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.doctorCard}>
                  <Skeleton width={70} height={70} borderRadius={35} style={{ marginBottom: 12 }} />
                  <Skeleton width={100} height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width={80} height={12} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={filteredDoctors}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.doctorCard}
                  onPress={() =>
                    router.push({
                      pathname: "/(patient)/book_appointment",
                      params: { id: item.id, name: item.first_name, fee: item.consultation_fee },
                    })
                  }
                >
                  <View style={styles.docAvatarContainer}>
                    {item.profile_picture ? (
                      <Image source={{ uri: item.profile_picture }} style={styles.docImg} />
                    ) : (
                      <Text style={{ fontSize: 32 }}>👨‍⚕️</Text>
                    )}
                    <View style={styles.onlineIndicator} />
                  </View>
                  <Text style={styles.docName}>Dr. {item.first_name}</Text>
                  <Text style={styles.docSpecialty}>{item.specialization || "General"}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingValue}>{item.average_rating || "4.5"}</Text>
                    <Text style={styles.feeText}> • PKR {item.consultation_fee || '1500'}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No specialists found in this category.</Text>
              }
            />
          )}

          {/* RECENT MEDICAL RECORDS */}
          <View style={[styles.sectionHeader, { marginTop: 25 }]}>
            <Text style={styles.sectionTitle}>Recent Medical Records</Text>
            <TouchableOpacity onPress={() => router.push("/(patient)/records")}>
              <Text style={styles.seeAllText}>History</Text>
            </TouchableOpacity>
          </View>

          {medicalRecords.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No recent records found</Text>
            </View>
          ) : (
            medicalRecords.slice(0, 3).map((record: any) => (
              <TouchableOpacity key={record.id} style={styles.recordCard}>
                <View style={styles.recordIconBox}>
                  <Ionicons name="medical" size={20} color="#0a7ea4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordDiagnosis}>{record.diagnosis}</Text>
                  <Text style={styles.recordDoctor}>Dr. {record.doctor_name || 'Specialist'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.recordDate}>{record.created_at.split("T")[0]}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* SYMPTOM CHECKER MODAL */}
      <Modal visible={symptomModalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBody}>
            <View style={styles.modalHead}>
              <Text style={styles.modalHeadTitle}>Smart Symptom Matcher</Text>
              <TouchableOpacity onPress={() => setSymptomModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubText}>Describe what you're feeling (e.g., "chest pain", "skin rash", "fever")</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Enter symptoms..."
                style={styles.modalInput}
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.matchBtn} onPress={matchSymptoms}>
              <LinearGradient
                colors={['#0a7ea4', '#004d66']}
                style={styles.matchGradient}
              >
                <Text style={styles.matchBtnText}>Find Specialists</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },
  symptomBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#10B981',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  
  body: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAllText: { fontSize: 13, color: '#0a7ea4', fontWeight: '600' },

  categoryScroll: { marginBottom: 25 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  categoryText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#4B5563' },
  categoryTextActive: { color: '#FFF' },

  doctorCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
    width: 160,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  docAvatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  docImg: { width: 70, height: 70, borderRadius: 35 },
  onlineIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  docName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  docSpecialty: { fontSize: 12, color: '#6B7280', marginVertical: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingValue: { fontSize: 12, color: '#111827', fontWeight: 'bold', marginLeft: 4 },
  feeText: { fontSize: 11, color: '#6B7280' },

  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  recordIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recordDiagnosis: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  recordDoctor: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  recordDate: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  emptyStateContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 10, textAlign: 'center' },

  // Referral Ticket Styles
  referralContainer: { paddingHorizontal: 0, marginBottom: 25 },
  referralCard: { borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#0a7ea4', elevation: 3 },
  referralHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ticketIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  referralTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#0369a1' },
  statusBadge: { backgroundColor: '#bae6fd', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#0369a1' },
  referralContent: { marginBottom: 16 },
  refInfo: { fontSize: 13, color: '#64748b' },
  targetDoctor: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 4 },
  targetSpec: { fontSize: 14, color: '#0a7ea4', fontWeight: 'bold' },
  refReasonBox: { marginTop: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 8 },
  refReasonLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  refReasonText: { fontSize: 12, color: '#1e293b', marginTop: 2, fontStyle: 'italic' },
  bookNowBtn: { backgroundColor: '#0a7ea4', height: 45, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  bookNowText: { color: 'white', fontWeight: 'bold', marginRight: 8 },

  // MODAL STYLES
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBody: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: 350,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalHeadTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalSubText: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  inputContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },
  modalInput: { fontSize: 16, color: '#111827', minHeight: 80, textAlignVertical: 'top' },
  matchBtn: { borderRadius: 15, overflow: 'hidden' },
  matchGradient: { paddingVertical: 15, alignItems: 'center' },
  matchBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
