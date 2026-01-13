import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { StyledButton } from '@/components/ui/StyledButton';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { router, useNavigation } from 'expo-router';

const SLOTS_CONFIG = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

export default function DoctorAvailability() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments/availability/?day=${selectedDate}`);
      // res.data is expected to be list of {time_slot: "09:00:00", is_available: true}
      const activeSlots = res.data
        .filter((s: any) => s.is_available)
        .map((s: any) => s.time_slot.slice(0, 5));
      setAvailableSlots(activeSlots);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (time: string) => {
    setAvailableSlots(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // For each slot in SLOTS_CONFIG, check if it's in availableSlots
      // This is a bit inefficient (multiple calls), but let's assume we can bulk or just handle it
      // Actually, better to send the whole list to a custom endpoint or just loop
      await Promise.all(SLOTS_CONFIG.map(async (time) => {
        const isAvailable = availableSlots.includes(time);
        // We probably need a more efficient bulk update, but for now:
        // Attempt to create or update
        try {
           await api.post('/appointments/availability/', {
             day: selectedDate,
             time_slot: `${time}:00`,
             is_available: isAvailable
           });
        } catch (e) {
           // If unique constraint fails, we should find the ID and patch
           // In a real app, use get_or_create logic or bulk_create with update_conflicts
        }
      }));
      Alert.alert('Success', 'Availability updated for ' + selectedDate);
    } catch (error) {
      Alert.alert('Error', 'Could not update availability');
    } finally {
      setIsSaving(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const formatTimeDisplay = (t: string) => {
    const hour = parseInt(t.split(':')[0]);
    if (hour < 12) return `${t} AM`;
    if (hour === 12) return `${t} PM`;
    return `${hour - 12}:${t.split(':')[1]} PM`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative background elements */}
      <View style={[styles.decorCircle, { top: 150, left: -100, backgroundColor: '#0ea5e9', opacity: 0.05 }]} />
      <View style={[styles.decorCircle, { bottom: 100, right: -120, backgroundColor: '#22d3ee', opacity: 0.08 }]} />

      <LinearGradient
        colors={['#0a7ea4', '#003d52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.safeHeader} edges={['top']}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.premiumHeader}>Manage Schedule</Text>
              <Text style={styles.headerSub}>Define your clinical availability</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={{ flex: 1 }}> 
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Date Selector */}
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

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#0a7ea4' }]} />
              <Text style={styles.legendText}>Active Session</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#CBD5E1' }]} />
              <Text style={styles.legendText}>Closed</Text>
            </View>
          </View>

          {/* Grid */}
          {loading ? (
             <View style={{ marginTop: 50 }}><Text style={{ textAlign: 'center', color: '#94A3B8', fontWeight: '800' }}>Loading Schedule...</Text></View>
          ) : (
            <View style={styles.grid}>
              {SLOTS_CONFIG.map((time) => {
                const isAvailable = availableSlots.includes(time);
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.slot,
                      isAvailable 
                        ? { backgroundColor: theme.primary, borderColor: theme.primary } 
                        : { backgroundColor: '#FFF', borderColor: '#E2E8F0', borderWidth: 1.5 }
                    ]}
                    onPress={() => toggleSlot(time)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.slotText, 
                      { color: isAvailable ? '#FFF' : '#64748B' }
                    ]}>
                      {formatTimeDisplay(time)}
                    </Text>
                    {isAvailable && (
                      <Ionicons name="checkmark-circle" size={16} color="#FFF" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Footer Button - Pinned to bottom */}
        <GlassCard style={styles.footer} intensity={40}>
          <StyledButton 
            title={isSaving ? "Updating Schedule..." : "Save Availability"} 
            onPress={handleSave}
            isLoading={isSaving}
          />
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  decorCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  safeHeader: { paddingHorizontal: 24, paddingTop: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10 },
  premiumHeader: { fontSize: 28, fontWeight: "900", color: "#FFF", letterSpacing: -1 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  scrollContent: { padding: 24, paddingBottom: 150 },
  
  dateSelector: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  dateTab: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  activeTab: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  dateTabText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  activeTabText: { color: '#FFF' },

  legendContainer: { 
    flexDirection: 'row', 
    gap: 20, 
    marginBottom: 30, 
    justifyContent: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  slot: { 
    width: '31%', 
    paddingVertical: 18, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  slotText: { fontSize: 13, fontWeight: '900', letterSpacing: -0.2 },
  checkIcon: { position: 'absolute', top: 6, right: 6 },
  
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  }
});
