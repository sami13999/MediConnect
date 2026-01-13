import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const sections = [
    {
      title: "1. Data Collection",
      content: "MediConnect collects personal information such as name, email, and phone number to provide healthcare services. For doctors, we also collect professional credentials and specialization data."
    },
    {
      title: "2. Health Information (HIPAA Compliance)",
      content: "We take medical data privacy seriously. Your health records, prescriptions, and appointment history are encrypted and stored securely. We do not share medical data with third parties without explicit consent."
    },
    {
      title: "3. Usage of Data",
      content: "Data is used for appointment scheduling, medical record management, and push notifications for reminders. Analytics data is used solely to improve application performance."
    },
    {
      title: "4. Data Security",
      content: "We implement industry-standard security measures, including SSL encryption and secure cloud storage, to protect your data from unauthorized access, alteration, or disclosure."
    },
    {
      title: "5. Your Rights",
      content: "Users have the right to access their data, request corrections, or request deletion of their account and associated personal data at any time through the profile settings."
    },
    {
      title: "6. Contact Us",
      content: "If you have any questions regarding this Privacy Policy, please contact our support team at support@mediconnect.com."
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Privacy & Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.introText, { color: theme.textSecondary }]}>
          Last Updated: January 2026
        </Text>
        
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: theme.text }]}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            © 2026 MediConnect Healthcare Systems. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: Spacing.lg },
  introText: { fontSize: 14, marginBottom: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  sectionContent: { fontSize: 16, lineHeight: 24 },
  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 20 },
  footerText: { fontSize: 12, textAlign: 'center' },
});
