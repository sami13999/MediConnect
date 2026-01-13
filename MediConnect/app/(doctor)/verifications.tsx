import { StyledButton } from "@/components/ui/StyledButton";
import api from "@/services/api";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRouter } from "expo-router";

export default function VerificationList() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  
  // Verification Logic
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const onRefresh = React.useCallback(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    setRefreshing(true);
    try {
        const res = await api.get("/appointments/");
        // Show all pending, regardless of receipt, so doctor can reject if needed
        const pending = res.data.filter((a: any) => a.status === 'pending');
        setPendingPayments(pending);
    } catch (error) {
        console.log("Error fetching payments", error);
    } finally {
        setRefreshing(false);
    }
  };

  const openVerificationModal = (appointment: any) => {
      setSelectedReceipt(appointment.payment_receipt);
      setSelectedItem(appointment);
      setVerificationModalVisible(true);
  };

  const processPayment = async (status: 'confirmed' | 'cancelled') => {
      if (!selectedItem) return;
      try {
        await api.post(`/appointments/${selectedItem.id}/update_status/`, { status });
        Alert.alert("Success", `Payment ${status === 'confirmed' ? 'Verified' : 'Rejected'}`);
        setVerificationModalVisible(false);
        fetchPendingPayments(); 
      } catch (error) {
          Alert.alert("Error", "Action failed");
      }
  };

  const getImageUrl = (path: string | null) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const baseUrl = (process.env.EXPO_PUBLIC_API_URL || "").split('/api')[0];
      return `${baseUrl}${path}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Verifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4" />}
      >
        {pendingPayments.length === 0 ? (
           <View style={styles.emptyContainer}>
               <View style={styles.emptyIconCircle}>
                   <Ionicons name="checkmark-done-circle" size={60} color="#10B981" />
               </View>
               <Text style={styles.emptyTitle}>All Caught Up!</Text>
               <Text style={styles.emptySub}>No pending payment verifications.</Text>
           </View>
        ) : (
            pendingPayments.map((item) => (
                <GlassCard key={item.id} style={styles.paymentCard} intensity={20}>
                    <View style={styles.cardHeader}>
                         <View style={styles.patientInfo}>
                             <Text style={styles.patientName}>{item.patient_name}</Text>
                             <Text style={styles.apptTime}>{item.date} • {item.time?.slice(0,5)}</Text>
                         </View>
                         <View style={[styles.methodBadge, { backgroundColor: item.payment_method === 'easypaisa' ? '#DCFCE7' : '#DBEAFE' }]}>
                             <Text style={[styles.methodText, { color: item.payment_method === 'easypaisa' ? '#166534' : '#1E40AF' }]}>
                                 {item.payment_method === 'easypaisa' ? 'Easypaisa' : 'Bank Transfer'}
                             </Text>
                         </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardBody}>
                        {/* Thumbnail or Placeholder */}
                        <TouchableOpacity 
                            onPress={() => openVerificationModal(item)}
                            style={styles.thumbnailContainer}
                        >
                             {item.payment_receipt ? (
                                 <Image 
                                    source={{ uri: getImageUrl(item.payment_receipt) || "" }} 
                                    style={styles.thumbnail}
                                 />
                             ) : (
                                 <View style={styles.noReceiptPlaceholder}>
                                     <Ionicons name="image-outline" size={24} color="#94A3B8" />
                                     <Text style={styles.noReceiptText}>No Receipt</Text>
                                 </View>
                             )}
                        </TouchableOpacity>

                        <View style={styles.actions}>
                             <TouchableOpacity 
                                style={[styles.actionBtn, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}
                                onPress={() => {
                                    setSelectedItem(item);
                                    processPayment('cancelled');
                                }}
                             >
                                 <Text style={[styles.actionText, { color: '#EF4444' }]}>Reject</Text>
                             </TouchableOpacity>

                             <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' }]}
                                onPress={() => openVerificationModal(item)}
                             >
                                 <Text style={[styles.actionText, { color: '#FFF' }]}>Verify</Text>
                             </TouchableOpacity>
                        </View>
                    </View>
                </GlassCard>
            ))
        )}
      </ScrollView>

      {/* VERIFICATION MODAL */}
      <Modal visible={verificationModalVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBody}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Verify Payment</Text>
               <TouchableOpacity onPress={() => setVerificationModalVisible(false)} style={styles.closeBtn}>
                 <Ionicons name="close" size={20} color="#64748B" />
               </TouchableOpacity>
             </View>

             <View style={styles.receiptViewer}>
                {selectedReceipt ? (
                    <Image 
                        source={{ uri: getImageUrl(selectedReceipt) || "" }}
                        style={styles.fullReceiptImg}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.emptyReceiptView}>
                        <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
                         <Text style={{ color: '#94A3B8', marginTop: 10 }}>Patient has not uploaded a receipt.</Text>
                    </View>
                )}
             </View>

             {selectedItem && (
                 <View style={styles.detailsRow}>
                     <View>
                        <Text style={styles.label}>Patient</Text>
                        <Text style={styles.val}>{selectedItem.patient_name}</Text>
                     </View>
                     <View>
                        <Text style={styles.label}>Amount Due</Text>
                        {/* Assuming we can calculate or get fee, hardcoded or standard for now */}
                        <Text style={styles.val}>Review Receipt</Text> 
                     </View>
                 </View>
             )}

             <View style={styles.modalActions}>
                 <TouchableOpacity 
                    style={[styles.modalBtn, { backgroundColor: '#EF4444' }]}
                    onPress={() => processPayment('cancelled')}
                 >
                     <Ionicons name="close-circle" size={20} color="#FFF" />
                     <Text style={styles.modalBtnText}>Reject Payment</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                    style={[styles.modalBtn, { backgroundColor: '#10B981', flex: 1.5 }]}
                    onPress={() => processPayment('confirmed')}
                 >
                     <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                     <Text style={styles.modalBtnText}>Confirm Payment</Text>
                 </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748B' },

  paymentCard: {
    backgroundColor: '#FFF', borderRadius: 20, marginBottom: 15,
    borderWidth: 1, borderColor: '#E2E8F0', padding: 0, overflow: 'hidden'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  patientInfo: {},
  patientName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  apptTime: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  methodBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  methodText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9' },

  cardBody: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 15 },
  thumbnailContainer: {
      width: 70, height: 70, borderRadius: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC'
  },
  thumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },
  noReceiptPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noReceiptText: { fontSize: 8, color: '#94A3B8', textAlign: 'center', marginTop: 4 },

  actions: { flex: 1, flexDirection: 'row', gap: 10 },
  actionBtn: { 
      flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, 
      alignItems: 'center', justifyContent: 'center' 
  },
  actionText: { fontWeight: '700', fontSize: 13 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalBody: { backgroundColor: '#FFF', borderRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  closeBtn: { padding: 5, backgroundColor: '#F1F5F9', borderRadius: 20 },
  
  receiptViewer: { height: 400, backgroundColor: '#000', borderRadius: 16, overflow: 'hidden', marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  fullReceiptImg: { width: '100%', height: '100%' },
  emptyReceiptView: { backgroundColor: '#F1F5F9', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12 },
  label: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  val: { fontSize: 16, color: '#0F172A', fontWeight: '700' },

  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { 
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
      paddingVertical: 16, borderRadius: 14, gap: 8 
  },
  modalBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});
