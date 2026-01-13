import { StyledButton } from "@/components/ui/StyledButton";
import api from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function BookAppointment() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 1. Get Doctor Info from the previous screen
  const doctorId = params.id;
  const doctorName = params.name || "Doctor";
  // ✅ FIX: Use State so we can update it with fresh server data
  const [doctorFee, setDoctorFee] = useState(parseFloat(params.fee as string) || 0);

  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(true);

  // Payment Logic
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'bank' | null>(null);
  const [receiptImage, setReceiptImage] = useState<any>(null);
  const [doctorPaymentInfo, setDoctorPaymentInfo] = useState<any>({});

  // Configuration for all possible slots (same as doctor's view)
  const ALL_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  useEffect(() => {
    fetchSlots();
    fetchDoctorDetails(); // ✅ Fetch fresh fee
  }, [selectedDate, doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      const res = await api.get(`/appointments/doctors/${doctorId}/`);
      if (res.data.consultation_fee) {
        setDoctorFee(parseFloat(res.data.consultation_fee));
      }
    } catch (error) {
      console.log("Could not fetch fresh doctor details", error);
    }
  };

  const fetchSlots = async () => {
    setFetchingSlots(true);
    try {
      const res = await api.get(`/appointments/availability/?doctor_id=${doctorId}&day=${selectedDate}`);
      const slots = res.data
        .filter((s: any) => s.is_available)
        .map((s: any) => s.time_slot.slice(0, 5));
      setAvailableSlots(slots);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingSlots(false);
    }
  };

  const formatTimeDisplay = (t: string) => {
    const hour = parseInt(t.split(':')[0]);
    if (hour < 12) return `${t} AM`;
    if (hour === 12) return `${t} PM`;
    return `${hour - 12}:${t.split(':')[1]} PM`;
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 2. Calculations
  const advancePayable = (doctorFee * 0.2).toFixed(2); // 20%
  const totalFee = doctorFee.toFixed(2);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0]);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      Alert.alert("Required", "Please select a time slot first.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("doctor", doctorId as string);
      formData.append("date", selectedDate);
      formData.append("time", `${selectedSlot}:00`);
      formData.append("reason", "Consultation Booking");
      formData.append("status", "pending");
      formData.append("payment_method", paymentMethod || "");

      if (receiptImage) {
        // @ts-ignore
        formData.append("payment_receipt", {
          uri: Platform.OS === 'android' ? receiptImage.uri : receiptImage.uri.replace("file://", ""),
          name: `receipt_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }

      await api.post("/appointments/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Success", "Appointment Booked Successfully!", [
        { text: "OK", onPress: () => router.push("/(patient)") },
      ]);
    } catch (error: any) {
      if (error.response?.data?.code === "token_not_valid") {
        Alert.alert("Session Expired", "Please Logout and Login again.");
      } else {
        Alert.alert("Error", "Booking Failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.subHeader}>Dr. {doctorName}</Text>

        {/* Date Selector */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <View style={styles.dateSelector}>
           <TouchableOpacity 
            onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            style={[styles.dateTab, selectedDate === new Date().toISOString().split('T')[0] && styles.activeTab]}
           >
             <Text style={[styles.dateTabText, selectedDate === new Date().toISOString().split('T')[0] && styles.activeTabText]}>Today</Text>
           </TouchableOpacity>
           <TouchableOpacity 
            onPress={() => setSelectedDate(tomorrowStr)}
            style={[styles.dateTab, selectedDate === tomorrowStr && styles.activeTab]}
           >
             <Text style={[styles.dateTabText, selectedDate === tomorrowStr && styles.activeTabText]}>Tomorrow</Text>
           </TouchableOpacity>
        </View>

        {/* Slots Section */}
        <Text style={styles.sectionTitle}>Available Slots</Text>

        {fetchingSlots ? (
          <Text style={styles.loadingText}>Fetching available times...</Text>
        ) : availableSlots.length === 0 ? (
          <View style={styles.noSlots}>
            <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
            <Text style={styles.noSlotsText}>No slots available for this date.</Text>
          </View>
        ) : (
          <View style={styles.slotGrid}>
            {availableSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slot,
                  selectedSlot === slot && styles.selectedSlot,
                ]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text
                  style={[
                    styles.slotText,
                    selectedSlot === slot && styles.selectedSlotText,
                  ]}
                >
                  {formatTimeDisplay(slot)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Payment Card */}
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={20} color="white" />
            <Text style={styles.cardHeaderTitle}>Payment Breakdown</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Consultation Fee</Text>
              <Text style={styles.rowVal}>PKR {totalFee}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Total After Discount</Text>
              <Text style={styles.rowVal}>PKR {totalFee}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.totalLabel}>Advance Payable (20%)</Text>
              <Text style={styles.totalVal}>PKR {advancePayable}</Text>
            </View>
          </View>
          </View>

        {/* --- PAYMENT METHOD SELECTION --- */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        
        <View style={styles.paymentMethodsRow}>
            <TouchableOpacity 
              style={[styles.methodCard, paymentMethod === 'easypaisa' && styles.activeMethod]}
              onPress={() => setPaymentMethod('easypaisa')}
            >
               <Image source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Easypaisa_Logo.png" }} style={styles.methodLogo} resizeMode="contain" />
               <Text style={[styles.methodText, paymentMethod === 'easypaisa' && styles.activeMethodText]}>Easypaisa</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.methodCard, paymentMethod === 'bank' && styles.activeMethod]}
              onPress={() => setPaymentMethod('bank')}
            >
               <Ionicons name="business" size={24} color={paymentMethod === 'bank' ? '#FFF' : '#0a7ea4'} />
               <Text style={[styles.methodText, paymentMethod === 'bank' && styles.activeMethodText]}>Bank Transfer</Text>
            </TouchableOpacity>
        </View>

        {paymentMethod && (
            <View style={styles.paymentDetailsBox}>
                <Text style={styles.payHeader}>Transfer Details</Text>
                
                {paymentMethod === 'easypaisa' ? (
                   <View>
                      <Text style={styles.payLabel}>Easypaisa Number:</Text>
                      <Text style={styles.payValue}>{doctorPaymentInfo.easypaisa_number || "Not Provided"}</Text>
                      <Text style={styles.payLabel}>Account Title:</Text>
                      <Text style={styles.payValue}>{doctorPaymentInfo.easypaisa_title || "Not Provided"}</Text>
                   </View>
                ) : (
                   <View>
                      <Text style={styles.payLabel}>Bank Name:</Text>
                      <Text style={styles.payValue}>{doctorPaymentInfo.bank_name || "Not Provided"}</Text>
                      <Text style={styles.payLabel}>Account Number (IBAN):</Text>
                      <Text style={styles.payValue}>{doctorPaymentInfo.bank_account_number || "Not Provided"}</Text>
                      <Text style={styles.payLabel}>Account Title:</Text>
                      <Text style={styles.payValue}>{doctorPaymentInfo.bank_account_title || "Not Provided"}</Text>
                   </View>
                )}

                <View style={styles.divider} />

                <Text style={styles.payHeader}>Proof of Payment</Text>
                <TouchableOpacity onPress={pickImage} style={styles.uploadBtn}>
                    {receiptImage ? (
                        <Image source={{ uri: receiptImage.uri }} style={styles.uploadedImg} />
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Ionicons name="cloud-upload-outline" size={32} color="#64748B" />
                            <Text style={styles.uploadText}>Upload Screenshot</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        )}

        <Text style={styles.note}>
          <Ionicons name="information-circle-outline" size={14} /> The remaining
          PKR {(doctorFee * 0.8).toFixed(2)} will be paid at the clinic.
        </Text>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <StyledButton
          title={receiptImage ? `Submit Payment & Book` : `Pay PKR ${advancePayable} & Confirm`}
          onPress={handleBook}
          isLoading={loading}
          // disabled={!receiptImage && !!paymentMethod} // Optional: Enforce receipt if payment method selected?
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    elevation: 2,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0a7ea4",
    marginBottom: 20,
    textAlign: "center",
  },

  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15 },
  slotLabel: { color: "#888", marginBottom: 10, fontSize: 12 },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  slot: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#eee",
    minWidth: "30%",
    alignItems: "center",
  },
  selectedSlot: { backgroundColor: "#0a7ea4", borderColor: "#0a7ea4" },
  slotText: { fontSize: 13, color: "#333", fontWeight: "600" },
  selectedSlotText: { color: "white" },

  paymentCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
    backgroundColor: "white",
    elevation: 3,
  },
  cardHeader: {
    backgroundColor: "#333",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardHeaderTitle: { color: "white", fontWeight: "bold", fontSize: 14 },
  cardBody: { padding: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rowLabel: { color: "#666", fontSize: 14 },
  rowVal: { fontWeight: "bold", color: "#333", fontSize: 14 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 10 },
  totalLabel: { fontWeight: "bold", fontSize: 15, color: "#333" },
  totalVal: { fontWeight: "bold", fontSize: 18, color: "#0a7ea4" },

  note: { color: "#888", fontSize: 12, marginTop: 15, textAlign: "center" },
  dateSelector: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  dateTab: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  activeTab: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  dateTabText: { fontSize: 14, fontWeight: '700', color: '#666' },
  activeTabText: { color: '#FFF' },
  loadingText: { color: '#888', fontStyle: 'italic', marginBottom: 20 },
  noSlots: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
  noSlotsText: { color: '#94A3B8', marginTop: 10, fontWeight: '600' },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  
  // Payment Styles
  paymentMethodsRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  methodCard: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15, 
    backgroundColor: 'white', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    gap: 10
  },
  activeMethod: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  methodLogo: { width: 30, height: 30 },
  methodText: { fontWeight: '700', color: '#64748B' },
  activeMethodText: { color: '#FFF' },

  paymentDetailsBox: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    marginBottom: 20
  },
  payHeader: { fontSize: 16, fontWeight: '800', color: '#0369a1', marginBottom: 12 },
  payLabel: { fontSize: 12, color: '#64748B', fontWeight: 'bold', marginTop: 8 },
  payValue: { fontSize: 16, color: '#0F172A', fontWeight: '600' },
  
  uploadBtn: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden'
  },
  uploadText: { color: '#64748B', fontWeight: '600', marginTop: 5 },
  uploadedImg: { width: '100%', height: '100%', resizeMode: 'cover' },
});
