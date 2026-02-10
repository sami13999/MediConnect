import React, { useEffect, useState } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAlert } from '@/context/AlertContext';
import api from '@/services/api';
import { GlassCard } from '@/components/ui/GlassCard';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function PatientRecords() {
  const { showAlert } = useAlert();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>({});

  useEffect(() => {
    fetchRecords();
    fetchProfile();
    requestPermissions();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/profile/");
      setProfile(res.data);
    } catch (e) {}
  };

  const requestPermissions = async () => {
    if (isExpoGo) return;
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      showAlert({ title: 'Permission Required', message: 'Please enable notifications for medicine reminders.', icon: 'notifications-outline' });
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await api.get('/medical_records/');
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const downloadPrescription = async (item: any) => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #0a7ea4; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .title { color: #0a7ea4; font-size: 28px; font-weight: bold; margin: 0; }
            .info-box { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; font-size: 14px; text-transform: uppercase; }
            .value { font-size: 18px; margin-top: 5px; }
            .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">MEDICONNECT</h1>
            <p>Official Medical Record • Prescription Report</p>
          </div>
          <div class="info-box">
            <div>
              <p class="label">Patient</p>
              <p class="value">${profile.first_name || 'Valued'} ${profile.last_name || 'User'}</p>
            </div>
            <div style="text-align: right;">
              <p class="label">Date</p>
              <p class="value">${item.created_at?.split('T')[0] || 'N/A'}</p>
            </div>
          </div>
          <div class="section">
            <p class="label">Treating Physician</p>
            <p class="value">Dr. ${item.doctor_name || 'Medical Specialist'}</p>
          </div>
          <div class="section">
            <p class="label">Diagnosis</p>
            <p class="value">${item.diagnosis || 'General Consultation'}</p>
          </div>
          <div class="section">
            <p class="label">Prescription & Instructions</p>
            <p class="value" style="background: #f9f9f9; padding: 15px; border-radius: 8px;">${item.prescription || 'No specific instructions provided.'}</p>
          </div>
          <div class="footer">
            <p>This is a digitally generated report from MediConnect HealthSync Platform.</p>
            <p>&copy; 2026 MediConnect Inc. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      showAlert({ title: "Error", message: "Could not generate PDF", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
  };

  const scheduleReminder = async (medicine: string) => {
    if (isExpoGo) {
      showAlert({ title: "Expo Go Limitation", message: "Medicine reminders require a physical device.", icon: "phone-portrait-outline" });
      return;
    }
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medicine Reminder 💊",
          body: `It's time to take: ${medicine}`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 60,
        } as any, 
      });
      showAlert({ title: "Reminder Set", message: "We'll remind you in 1 minute.", icon: "alarm-outline" });
    } catch (error) {
      showAlert({ title: "Error", message: "Failed to set reminder", icon: "alert-circle-outline", iconColor: "#EF4444" });
    }
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
              <Text style={styles.premiumHeader}>Medical Records</Text>
              <Text style={styles.headerSub}>History of diagnoses & prescriptions</Text>
            </View>
            <TouchableOpacity style={styles.supportBtn} onPress={() => showAlert({ title: "Support", message: "Need help with your records? Contact support.", icon: "help-circle-outline" })}>
              <Ionicons name="help-circle-outline" size={24} color="#FFF" />
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
          data={records}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecords(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={60} color="#94A3B8" />
              <Text style={styles.emptyText}>No records found yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.card} intensity={40}>
              <View style={styles.cardHeader}>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={14} color="#0a7ea4" />
                  <Text style={styles.dateText}>{item.created_at?.split('T')[0] || 'N/A'}</Text>
                </View>
                <TouchableOpacity onPress={() => downloadPrescription(item)} style={styles.downloadBtn}>
                  <Ionicons name="download-outline" size={20} color="#0a7ea4" />
                </TouchableOpacity>
              </View>

              <View style={styles.diagnosisBox}>
                <Text style={styles.label}>DIAGNOSIS</Text>
                <Text style={styles.diagnosisText}>{item.diagnosis}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>PRESCRIPTION</Text>
                <Text style={styles.prescriptionText}>{item.prescription}</Text>
              </View>

              <View style={styles.footer}>
                <View style={styles.docRow}>
                  <View style={styles.docIcon}><Ionicons name="person" size={12} color="#0a7ea4" /></View>
                  <Text style={styles.docName}>Dr. {item.doctor_name}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.reminderBtn}
                  onPress={() => scheduleReminder(item.prescription)}
                >
                  <Ionicons name="notifications" size={14} color="#FFF" />
                  <Text style={styles.reminderText}>Remind Me</Text>
                </TouchableOpacity>
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
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 6 },
  dateText: { fontSize: 13, fontWeight: '700', color: '#0a7ea4' },
  downloadBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F9FF', elevation: 2 },
  diagnosisBox: { marginBottom: 15 },
  label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  diagnosisText: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  detailRow: { marginBottom: 20 },
  prescriptionText: { fontSize: 14, color: '#64748B', lineHeight: 20, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 15 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  docName: { fontSize: 13, fontWeight: '700', color: '#475569' },
  reminderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0a7ea4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  reminderText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyText: { marginTop: 15, fontSize: 16, fontWeight: '700', color: '#94A3B8' },
});