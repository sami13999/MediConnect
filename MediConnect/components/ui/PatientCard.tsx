import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  condition: string;
}

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleViewDetails = () => {
    router.push({
      pathname: '/(doctor)/patient-details',
      params: { 
        id: patient.id, 
        name: patient.name 
      }
    });
  };

  return (
    <TouchableOpacity 
      onPress={handleViewDetails}
      style={[styles.card, { backgroundColor: theme.background, shadowColor: theme.text }]}
    >
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{patient.name}</Text>
          <Text style={styles.details}>{patient.gender}, {patient.age} years</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9BA1A6" />
      </View>

      <View style={styles.divider} />

      <View style={styles.medicalInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="pulse" size={16} color={theme.tint} />
          <Text style={[styles.infoText, { color: theme.text }]}>Condition: {patient.condition}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#687076" />
          <Text style={[styles.infoText, { color: '#687076' }]}>Last Visit: {patient.lastVisit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    color: '#687076',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginBottom: 12,
  },
  medicalInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
});