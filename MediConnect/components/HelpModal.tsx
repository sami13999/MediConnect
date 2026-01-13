import React from 'react';
import { Modal, View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const HelpModal = ({ 
  visible, 
  onClose, 
  role = 'patient' 
}: { 
  visible: boolean; 
  onClose: () => void;
  role?: 'patient' | 'doctor';
}) => {
  const handleContactSupport = () => {
    const subject = role === 'doctor' ? 'Doctor Support Request' : 'Patient Support Request';
    Linking.openURL(`mailto:support@mediconnect.com?subject=${subject}`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Help & Support</Text>
            <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{padding: 20}}>
            <Text style={styles.sectionHeader}>About MediConnect</Text>
            <Text style={styles.text}>
                MediConnect is designed to bridge the gap between patients and doctors. 
                Our goal is to make healthcare accessible, allowing you to book appointments 
                and manage medical records digitally.
            </Text>

            <Text style={styles.sectionHeader}>{role === 'doctor' ? 'Provider Quick Guide' : 'Patient Quick Guide'}</Text>
            
            {role === 'doctor' ? (
              <>
                <View style={styles.step}>
                    <Ionicons name="people-outline" size={20} color="#0a7ea4" />
                    <Text style={styles.stepText}><Text style={{fontWeight:'bold'}}>Patients:</Text> View scheduled consultations on your dashboard.</Text>
                </View>
                <View style={styles.step}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#0a7ea4" />
                    <Text style={styles.stepText}><Text style={{fontWeight:'bold'}}>Communication:</Text> Use secure chat for follow-ups after accepting requests.</Text>
                </View>
                <View style={styles.step}>
                    <Ionicons name="settings-outline" size={20} color="#0a7ea4" />
                    <Text style={styles.stepText}><Text style={{fontWeight:'bold'}}>Practice:</Text> Keep your fees and hospital info updated for accuracy in referrals.</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.step}>
                    <Ionicons name="calendar-outline" size={20} color="#0a7ea4" />
                    <Text style={styles.stepText}><Text style={{fontWeight:'bold'}}>Booking:</Text> Go to the Dashboard, select a doctor, and click "Book".</Text>
                </View>
                <View style={styles.step}>
                    <Ionicons name="document-text-outline" size={20} color="#0a7ea4" />
                    <Text style={styles.stepText}><Text style={{fontWeight:'bold'}}>Records:</Text> View your history and active referrals in the Records tab.</Text>
                </View>
                <View style={styles.step}>
                    <Ionicons name="person-circle-outline" size={20} color="#0a7ea4" />
                    <Text style={styles.stepText}><Text style={{fontWeight:'bold'}}>Profile:</Text> Update your allergies and emergency info for better safety.</Text>
                </View>
              </>
            )}

            <Text style={styles.sectionHeader}>Need Assistance?</Text>
            <Text style={styles.text}>
              {role === 'doctor' 
                ? 'Our provider support team is available 24/7 for technical issues or account queries.'
                : 'Having trouble? Our patient assistance team is here to help you navigate your healthcare journey.'}
            </Text>
            
            <TouchableOpacity style={styles.contactSupportBtn} onPress={handleContactSupport}>
                <Ionicons name="mail" size={20} color="#FFF" />
                <Text style={styles.contactSupportText}>Contact Support Team</Text>
            </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 20 },
  title: { fontSize: 22, fontWeight: 'bold' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#0a7ea4', marginTop: 20, marginBottom: 10 },
  text: { fontSize: 16, color: '#555', lineHeight: 24 },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  stepText: { marginLeft: 10, flex: 1, fontSize: 14, color: '#444' },
  contactSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  contactSupportText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});