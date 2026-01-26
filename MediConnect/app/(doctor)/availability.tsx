import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { StyledButton } from '@/components/ui/StyledButton';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import api from '@/services/api';
import { useNavigation } from 'expo-router';
import { useAlert } from '@/context/AlertContext';

// 9 AM to 7:30 PM slots
const SLOTS_CONFIG = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

export default function DoctorAvailability() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [datesList, setDatesList] = useState<Date[]>([]);
  
  // Custom Alert Context
  const { showAlert } = useAlert();

  useEffect(() => {
    generateDates();
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate]);

  const generateDates = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
       const d = new Date(today);
       d.setDate(today.getDate() + i);
       list.push(d);
    }
    setDatesList(list);
  };

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments/availability/?day=${selectedDate}`);
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

  const handleSavePress = () => {
    const dateObj = new Date(selectedDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    showAlert({
      title: "Update Schedule",
      message: `Do you want to apply this schedule only for ${selectedDate} or repeat it for all upcoming ${dayName}s?`,
      icon: "calendar",
      buttons: [
        {
          text: "Only This Day",
          style: 'cancel',
          onPress: () => saveSlots([selectedDate]),
        },
        {
          text: `All ${dayName}s (4 Weeks)`,
          style: 'default',
          onPress: () => calculateAndSaveRecurring(selectedDate)
        }
      ]
    });
  };

  const calculateAndSaveRecurring = (baseDateStr: string) => {
    const datesToUpdate = [baseDateStr];
    const baseDate = new Date(baseDateStr);
    
    // Add next 3 weeks (total 4 occurrences)
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + (i * 7));
      datesToUpdate.push(nextDate.toISOString().split('T')[0]);
    }

    saveSlots(datesToUpdate);
  };

  const saveSlots = async (targetDates: string[]) => {
    setIsSaving(true);

    try {
      // Flatten requests: For each DATE, update all SLOTS
      const requests = [];

      for (const date of targetDates) {
         for (const time of SLOTS_CONFIG) {
            const isAvailable = availableSlots.includes(time);
            requests.push(
               api.post('/appointments/availability/', {
                 day: date,
                 time_slot: `${time}:00`,
                 is_available: isAvailable
               }).catch(e => {}) 
            );
         }
      }

      await Promise.all(requests);
      
      showAlert({
          title: "Schedule Updated",
          message: targetDates.length > 1 
            ? `Availability set for the next 4 weeks successfully!` 
            : 'Availability updated successfully!',
          icon: "checkmark-circle",
          buttons: [{ text: "Great!", style: 'default', onPress: () => {} }]
        });

    } catch (error) {
       showAlert({
          title: "Error",
          message: "Could not update availability. Please try again.",
          icon: "alert-circle",
          iconColor: "#EF4444",
           buttons: [{ text: "OK", style: 'cancel', onPress: () => {} }]
        });
    } finally {
      setIsSaving(false);
    }
  };

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

          {/* New Horizontal Date Selector */}
          <View style={styles.dateSelectorContainer}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}>
                {datesList.map((date, index) => {
                   const dateStr = date.toISOString().split('T')[0];
                   const isActive = selectedDate === dateStr;
                   const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                   const dayNum = date.getDate();

                   return (
                     <TouchableOpacity 
                       key={index}
                       style={[styles.dateCard, isActive && styles.activeDateCard]}
                       onPress={() => setSelectedDate(dateStr)}
                       activeOpacity={0.7}
                     >
                        <Text style={[styles.dayName, isActive && styles.activeDayName]}>{dayName}</Text>
                        <View style={[styles.matchesBadge, isActive ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: '#F1F5F9' }]}>
                           <Text style={[styles.dayNumber, isActive && styles.activeDayNumber]}>{dayNum}</Text>
                        </View>
                        {index === 0 && (
                          <View style={styles.todayInd}>
                             <Text style={styles.todayText}>Today</Text>
                          </View>
                        )}
                     </TouchableOpacity>
                   );
                })}
             </ScrollView>
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

        {/* Footer Button */}
        <GlassCard style={styles.footer} intensity={40}>
          <StyledButton 
            title={isSaving ? "Updating Schedule..." : "Save Availability"} 
            onPress={handleSavePress}
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
    paddingBottom: 20, // reduced padding since date selector is larger
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#0a7ea4",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  safeHeader: { paddingHorizontal: 24, paddingTop: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10 },
  premiumHeader: { fontSize: 26, fontWeight: "900", color: "#FFF", letterSpacing: -1 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  scrollContent: { padding: 24, paddingBottom: 150 },
  
  // New Date Selector Styles
  dateSelectorContainer: { marginBottom: 25, height: 90 }, // Fixed height for horizontal scroll
  dateCard: { 
     width: 60, 
     height: 85, // Taller card
     backgroundColor: '#FFF', 
     borderRadius: 30, // Pill shape
     alignItems: 'center', 
     justifyContent: 'center',
     paddingVertical: 5,
     borderWidth: 1, 
     borderColor: '#E2E8F0',
     marginRight: 4,
     
     shadowColor: "#000",
     shadowOpacity: 0.05,
     shadowRadius: 4,
     elevation: 2,
  },
  activeDateCard: { 
    backgroundColor: '#0a7ea4', 
    borderColor: '#0a7ea4',
    transform: [{ scale: 1.05 }], // Slight pop
  },
  dayName: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 },
  activeDayName: { color: 'rgba(255,255,255,0.8)' },
  
  matchesBadge: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  dayNumber: { fontSize: 16, fontWeight: '900', color: '#334155' },
  activeDayNumber: { color: '#FFF' },

  todayInd: { position: 'absolute', top: -8, backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  todayText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },

  legendContainer: { 
    flexDirection: 'row', 
    gap: 20, 
    marginBottom: 30, 
    justifyContent: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  
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
