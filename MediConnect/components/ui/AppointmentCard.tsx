import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Appointment {
  id: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
}

interface AppointmentCardProps {
  appointment: Appointment;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return '#10B981'; // Green
      case 'Pending': return '#F59E0B';   // Orange
      case 'Completed': return '#6B7280'; // Gray
      default: return theme.text;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.background, shadowColor: theme.text }]}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{appointment.doctorName.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{appointment.doctorName}</Text>
          <Text style={styles.specialization}>{appointment.specialization}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(appointment.status) }]}>
            {appointment.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={theme.icon} />
          <Text style={[styles.detailText, { color: theme.text }]}>{appointment.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={theme.icon} />
          <Text style={[styles.detailText, { color: theme.text }]}>{appointment.time}</Text>
        </View>
      </View>
    </View>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
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
  specialization: {
    fontSize: 14,
    color: '#687076',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
});