import { StyledButton } from "@/components/ui/StyledButton";
import { StyledInput } from "@/components/ui/StyledInput";
import api from "@/services/api";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";

export default function FinanceSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [formData, setFormData] = useState({
    consultation_fee: "",
    easypaisa_number: "",
    easypaisa_title: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_title: "",
  });

  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchPendingPayments();
  }, []);

  const fetchProfile = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/users/profile/");
        setFormData({
            consultation_fee: res.data.consultation_fee ? String(res.data.consultation_fee) : "",
            easypaisa_number: res.data.easypaisa_number || "",
            easypaisa_title: res.data.easypaisa_title || "",
            bank_name: res.data.bank_name || "",
            bank_account_number: res.data.bank_account_number || "",
            bank_account_title: res.data.bank_account_title || "",
        });
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };



  const onRefresh = React.useCallback(() => {
    fetchProfile();
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
        // Fetch all appointments and filter locally for now, or use a filtered endpoint if available.
        // Assuming /appointments/ returns list for doctor
        const res = await api.get("/appointments/");
        const pending = res.data.filter((a: any) => a.status === 'pending');
        setPendingPayments(pending);
    } catch (error) {
        console.log("Error fetching payments", error);
    }
  };



  const updateSettings = async () => {
    setLoading(true);
    try {
      const payload = {
         ...formData,
         consultation_fee: parseFloat(formData.consultation_fee) || 0,
      };
      await api.patch("/users/profile/", payload);
      Alert.alert("Success", "Payment settings updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Decor */}
      <View style={[styles.decorCircle, { top: -100, right: -100, backgroundColor: '#0ea5e9', opacity: 0.1 }]} />
      <View style={[styles.decorCircle, { bottom: 0, left: -50, backgroundColor: '#14b8a6', opacity: 0.05 }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
            contentContainerStyle={{ paddingBottom: 40 }} 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4" />
            }
        >
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Finance & Fees</Text>
                <Text style={styles.headerSubtitle}>Manage fees, accounts, and verify payments.</Text>
            </View>

            <View style={styles.content}>
                
                {/* 0. PENDING PAYMENTS NAVIGATION */}
                <TouchableOpacity onPress={() => router.push('/(doctor)/verifications')}>
                    <GlassCard style={styles.navCard} intensity={40}>
                        <View style={styles.navCardLeft}>
                             <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                                <Ionicons name="shield-checkmark-outline" size={24} color="#0284C7" />
                             </View>
                             <View>
                                 <Text style={styles.navCardTitle}>Pending requests</Text>
                                 <Text style={styles.navCardSub}>{pendingPayments.length} awaiting action</Text>
                             </View>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingPayments.length}</Text>
                        </View>
                    </GlassCard>
                </TouchableOpacity>

                <Text style={styles.sectionHeading}>Configuration</Text>

                {/* 1. FEE SECTION */}
                <GlassCard style={styles.card} intensity={40}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                            <Ionicons name="cash-outline" size={24} color="#0284C7" />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Consultation Fee</Text>
                            <Text style={styles.cardSub}>Set your checkup charges</Text>
                        </View>
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Fee Amount (PKR)</Text>
                        <StyledInput 
                            value={formData.consultation_fee} 
                            onChangeText={(t) => setFormData({...formData, consultation_fee: t})} 
                            placeholder="e.g. 1500" 
                            keyboardType="numeric"
                            icon="pricetag-outline"
                        />
                         <Text style={styles.helperText}>This amount will be shown to patients during booking.</Text>
                    </View>
                </GlassCard>

                {/* 2. EASYPAISA SECTION */}
                <GlassCard style={styles.card} intensity={40}>
                    <View style={styles.cardHeader}>
                         <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                            {/* Simple text logo representation or icon */}
                            <Text style={{ fontWeight: '900', color: '#16A34A', fontSize: 10 }}>EP</Text>
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Easypaisa Detail</Text>
                            <Text style={styles.cardSub}>Receive mobile payments</Text>
                        </View>
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Easypaisa Number</Text>
                        <StyledInput 
                            value={formData.easypaisa_number} 
                            onChangeText={(t) => setFormData({...formData, easypaisa_number: t})} 
                            placeholder="03XXXXXXXXX" 
                            keyboardType="phone-pad"
                            icon="call-outline"
                        />

                        <View style={{ height: 15 }} />

                        <Text style={styles.label}>Account Title</Text>
                        <StyledInput 
                            value={formData.easypaisa_title} 
                            onChangeText={(t) => setFormData({...formData, easypaisa_title: t})} 
                            placeholder="Account Holder Name" 
                            icon="person-outline"
                        />
                    </View>
                </GlassCard>

                {/* 3. BANK SECTION */}
                <GlassCard style={styles.card} intensity={40}>
                    <View style={styles.cardHeader}>
                         <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                            <Ionicons name="business-outline" size={24} color="#7C3AED" />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Bank Transfer</Text>
                            <Text style={styles.cardSub}>Direct bank deposits</Text>
                        </View>
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Bank Name</Text>
                        <StyledInput 
                            value={formData.bank_name} 
                            onChangeText={(t) => setFormData({...formData, bank_name: t})} 
                            placeholder="Meezan, HBL, Allied..." 
                            icon="briefcase-outline"
                        />

                        <View style={{ height: 15 }} />

                        <Text style={styles.label}>Account Number / IBAN</Text>
                         <StyledInput 
                            value={formData.bank_account_number} 
                            onChangeText={(t) => setFormData({...formData, bank_account_number: t})} 
                            placeholder="PK36MEZN00..." 
                            icon="card-outline"
                        />

                        <View style={{ height: 15 }} />

                        <Text style={styles.label}>Account Title</Text>
                        <StyledInput 
                            value={formData.bank_account_title} 
                            onChangeText={(t) => setFormData({...formData, bank_account_title: t})} 
                            placeholder="Account Holder Name" 
                             icon="person-outline"
                        />
                    </View>
                </GlassCard>

                <View style={{ marginTop: 20 }}>
                    <StyledButton 
                        title="Save Changes" 
                        onPress={updateSettings} 
                        isLoading={loading} 
                    />
                </View>

            </View>
        </ScrollView>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  decorCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 5, fontWeight: '500' },

  content: { padding: 24, gap: 20 },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 5 },
  
  card: { padding: 20, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  cardSub: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

  inputContainer: { },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  helperText: { fontSize: 11, color: '#94A3B8', marginTop: 6, marginLeft: 4 },

  // Payment List Styles
  paymentCard: { padding: 16, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payPatientName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  payDate: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  payMethodBadge: { fontSize: 10, fontWeight: '700', color: '#0a7ea4', backgroundColor: '#E0F2FE', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  verifyActionBtn: { backgroundColor: '#0a7ea4', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  verifyActionText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // Modal Styles
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
  modalBody: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeadTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  
  receiptContainer: {
    height: 350,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  receiptImg: { width: '100%', height: '100%' },
  
  actionRowFull: { flexDirection: 'row', gap: 12 },
  verifyBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2
  },
  verifyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  
  // New Styles
  payThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  }
});
