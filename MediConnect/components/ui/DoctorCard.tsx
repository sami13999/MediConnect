import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  consultationFee: number;
  image?: string; // Optional image URL
}

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleBook = () => {
    router.push({
      pathname: '/(patient)/book-appointment',
      params: { 
        doctorId: doctor.id, 
        name: doctor.name, 
        fee: doctor.consultationFee.toString() 
      }
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={styles.row}>
        {/* Avatar Section */}
        <View style={styles.imageContainer}>
          {doctor.image ? (
            <Image source={{ uri: doctor.image }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint + '15' }]}>
              <Text style={[styles.avatarText, { color: theme.tint }]}>
                {doctor.name.charAt(4)}
              </Text>
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {doctor.name}
            </Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{doctor.rating}</Text>
            </View>
          </View>
          
          <Text style={styles.specialization}>{doctor.specialization}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color="#9BA1A6" />
            <Text style={styles.locationText}>City Hospital, NY</Text>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: '#F0F0F0' }]} />

      {/* Action Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Consultation Fee</Text>
          {/* Updated to display PKR */}
          <Text style={[styles.price, { color: theme.tint }]}>
            PKR {doctor.consultationFee}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.bookBtn, { backgroundColor: theme.tint }]}
          onPress={handleBook}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24, // Softer corners
    padding: 16,
    marginBottom: 16,
    // Modern Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  imageContainer: { position: 'relative', marginRight: 16 },
  avatarImage: { width: 60, height: 60, borderRadius: 20 },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: 'bold' },
  onlineBadge: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981',
    position: 'absolute', bottom: -2, right: -2, borderWidth: 2, borderColor: '#FFF'
  },
  infoContainer: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9C4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#B45309' },
  specialization: { fontSize: 14, color: '#687076', marginTop: 4, marginBottom: 8, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: '#9BA1A6' },
  divider: { height: 1, marginVertical: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 12, color: '#9BA1A6', marginBottom: 2 },
  price: { fontSize: 18, fontWeight: 'bold' },
  bookBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, elevation: 2 },
  bookBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});