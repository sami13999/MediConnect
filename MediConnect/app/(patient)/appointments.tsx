import React, { useEffect, useState } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '@/context/AlertContext';
import api from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';

export default function PatientAppointments() {
  const { showAlert } = useAlert();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/');
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={StyleSheet.absoluteFill} />
      
      {/* Background Decor */}
      <View style={[styles.decorCircle, { top: 150, left: -100, backgroundColor: '#0ea5e9', opacity: 0.05 }]} />
      <View style={[styles.decorCircle, { bottom: 100, right: -120, backgroundColor: '#22d3ee', opacity: 0.08 }]} />

      <LinearGradient 
        colors={['#0a7ea4', '#003d52']} 
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.safeHeader} edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.premiumHeader}>My Appointments</Text>
              <Text style={styles.headerSub}>Manage your scheduled consultations</Text>
            </View>
            <TouchableOpacity style={styles.supportBtn} onPress={() => showAlert({ title: "Booking Info", message: "Need to reschedule? Contact your doctor directly via chat.", icon: "information-circle-outline" })}>
              <Ionicons name="information-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={60} color="#94A3B8" />
              <Text style={styles.emptyText}>No appointments scheduled</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.card} intensity={40}>
              <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {item.doctor_name ? item.doctor_name.charAt(0).toUpperCase() : 'D'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.docName}>Dr. {item.doctor_name}</Text>
                    <Text style={styles.docSpec}>{item.doctor_specialization || 'General'}</Text>
                  </View>
                </View>

                <View style={[
                  styles.badge, 
                  { backgroundColor: item.status === 'confirmed' ? '#D1FAE5' : item.status === 'pending' ? '#FEF3C7' : '#FEE2E2' }
                ]}>
                  <Text style={[
                    styles.badgeText, 
                    { color: item.status === 'confirmed' ? '#059669' : item.status === 'pending' ? '#D97706' : '#EF4444' }
                  ]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.footerRow}>
                <View style={styles.timeInfo}>
                  <Ionicons name="calendar" size={16} color="#0a7ea4" />
                  <Text style={styles.timeText}>{item.date}</Text>
                </View>
                <View style={styles.timeInfo}>
                  <Ionicons name="time" size={16} color="#0a7ea4" />
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
              </View>
            </GlassCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  decorCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
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
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
  premiumHeader: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  supportBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  doctorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#0369A1' },
  docName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  docSpec: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 15 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyText: { marginTop: 15, fontSize: 16, fontWeight: '700', color: '#94A3B8' },
});