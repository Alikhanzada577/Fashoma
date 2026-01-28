import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { router, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Unit = 'CM' | 'INCHES';

interface Measurement {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  section: 'upper' | 'lower';
}

const INITIAL_MEASUREMENTS: Measurement[] = [
  { id: 'shoulders', label: 'Shoulders', value: 47.0, min: 30, max: 60, section: 'upper' },
  { id: 'chest', label: 'Chest', value: 102.5, min: 70, max: 140, section: 'upper' },
  { id: 'waist', label: 'Waist', value: 88.5, min: 50, max: 120, section: 'upper' },
  { id: 'hips', label: 'Hips', value: 96.0, min: 70, max: 130, section: 'lower' },
  { id: 'inseam', label: 'Inseam', value: 81.5, min: 60, max: 100, section: 'lower' },
];

export default function EditMeasurementsScreen() {
  const params = useLocalSearchParams();
  const [unit, setUnit] = useState<Unit>('CM');
  const [measurements, setMeasurements] = useState<Measurement[]>(INITIAL_MEASUREMENTS);
  const [expandedId, setExpandedId] = useState<string | null>('chest');

  // Get photos from params
  const frontPhoto = params.frontPhoto as string;

  const [fontsLoaded] = useFonts({
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const convertValue = (value: number): number => {
    if (unit === 'INCHES') {
      return Math.round(value / 2.54 * 10) / 10;
    }
    return value;
  };

  const handleMeasurementChange = (id: string, newValue: number) => {
    setMeasurements(prev =>
      prev.map(m => (m.id === id ? { ...m, value: newValue } : m))
    );
  };

  const handleIncrement = (id: string) => {
    const measurement = measurements.find(m => m.id === id);
    if (measurement && measurement.value < measurement.max) {
      handleMeasurementChange(id, Math.round((measurement.value + 0.5) * 10) / 10);
    }
  };

  const handleDecrement = (id: string) => {
    const measurement = measurements.find(m => m.id === id);
    if (measurement && measurement.value > measurement.min) {
      handleMeasurementChange(id, Math.round((measurement.value - 0.5) * 10) / 10);
    }
  };

  const handleSynchronize = () => {
    router.push('/avatar/avatar-complete');
  };

  const upperMeasurements = measurements.filter(m => m.section === 'upper');
  const lowerMeasurements = measurements.filter(m => m.section === 'lower');

  const renderMeasurementItem = (measurement: Measurement, index: number) => {
    const isExpanded = expandedId === measurement.id;
    const displayValue = convertValue(measurement.value);

    return (
      <TouchableOpacity
        key={measurement.id}
        style={styles.measurementItem}
        onPress={() => setExpandedId(isExpanded ? null : measurement.id)}
        activeOpacity={0.7}
      >
        <View style={styles.measurementHeader}>
          <View style={styles.measurementLabelContainer}>
            <Text style={styles.measurementIndex}>0{index + 1}</Text>
            <Text style={styles.measurementLabel}>{measurement.label}</Text>
          </View>
          <Text style={styles.measurementValue}>
            {displayValue.toFixed(1)} <Text style={styles.unitText}>{unit}</Text>
          </Text>
        </View>

        {isExpanded && (
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleDecrement(measurement.id)}
            >
              <Ionicons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <Slider
              style={styles.slider}
              minimumValue={measurement.min}
              maximumValue={measurement.max}
              value={measurement.value}
              onValueChange={(value) => handleMeasurementChange(measurement.id, value)}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.gray[200]}
              thumbTintColor={Colors.white}
            />

            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleIncrement(measurement.id)}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray[50]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Preview */}
        <View style={styles.avatarPreview}>
          {frontPhoto ? (
            <Image 
              source={{ uri: frontPhoto }} 
              style={styles.avatarImage} 
              resizeMode="contain"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="body-outline" size={100} color={Colors.gray[400]} />
            </View>
          )}
        </View>

        {/* Unit Toggle */}
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'CM' && styles.unitButtonActive]}
            onPress={() => setUnit('CM')}
          >
            <Text style={[styles.unitButtonText, unit === 'CM' && styles.unitButtonTextActive]}>
              CM
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'INCHES' && styles.unitButtonActive]}
            onPress={() => setUnit('INCHES')}
          >
            <Text style={[styles.unitButtonText, unit === 'INCHES' && styles.unitButtonTextActive]}>
              INCHES
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upper Body Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FOUNDATION: UPPER</Text>
          <View style={styles.measurementsList}>
            {upperMeasurements.map((m, i) => renderMeasurementItem(m, i))}
          </View>
        </View>

        {/* Lower Body Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STRUCTURE: LOWER</Text>
          <View style={styles.measurementsList}>
            {lowerMeasurements.map((m, i) => renderMeasurementItem(m, upperMeasurements.length + i))}
          </View>
        </View>

        {/* Synchronize Button */}
        <TouchableOpacity
          style={styles.synchronizeButton}
          onPress={handleSynchronize}
          activeOpacity={0.8}
        >
          <Text style={styles.synchronizeButtonText}>SYNCHRONIZE TWIN DATA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarPreview: {
    height: 320,
    backgroundColor: Colors.gray[100],
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: Colors.gray[100],
  },
  unitButtonText: {
    fontSize: 14,
    fontFamily: 'ManropeMedium',
    color: Colors.text.secondary,
  },
  unitButtonTextActive: {
    color: Colors.text.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  measurementsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  measurementItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  measurementLabelContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  measurementIndex: {
    fontSize: 11,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  measurementLabel: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.text.primary,
  },
  measurementValue: {
    fontSize: 18,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
  },
  unitText: {
    fontSize: 12,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  adjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  synchronizeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  synchronizeButtonText: {
    fontSize: 14,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
    letterSpacing: 1,
  },
});
