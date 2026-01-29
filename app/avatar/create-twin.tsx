import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { PlayfairDisplay_400Regular_Italic, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope';
import { router } from 'expo-router';

const CAPTURE_OPTIONS = [
  { id: 1, title: 'Luminous Space', icon: 'sunny-outline' },
  { id: 2, title: 'Form-Fitting Attire', icon: 'shirt-outline' },
  { id: 3, title: 'Stable Perspective', icon: 'layers-outline' },
  { id: 4, title: 'Freedom to Move', icon: 'body-outline' },
];

export default function CreateTwinScreen() {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const toggleOption = (id: number) => {
    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter(optionId => optionId !== id));
    } else {
      setSelectedOptions([...selectedOptions, id]);
    }
  };

  const handleStartCapture = () => {
    router.push('/avatar/camera-permission');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header: starts from top, back + Fashoma centered */}
      <View style={[styles.headerSimple, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fashoma</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Create Your Twin</Text>
          <Text style={styles.subtitle}>
            To give you accurate fit recommendations,{'\n'}
            we need to create your 3D avatar.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {CAPTURE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedOptions.includes(option.id) && styles.optionCardSelected,
              ]}
              onPress={() => toggleOption(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={option.icon as any} size={24} color={Colors.text.primary} />
              </View>
              <Text style={styles.optionText}>{option.title}</Text>
              <View style={styles.cardEnd}>
                {selectedOptions.includes(option.id) && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.checkmark} />
                )}
                <View style={styles.greenDot} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Button - No container */}
        <TouchableOpacity
          style={[styles.startButton, { marginBottom: 40 + insets.bottom }]}
          onPress={handleStartCapture}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Capture</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F6',
  },
  headerSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  titleSection: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F4F1',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'ManropeRegular',
    color: Colors.text.primary,
  },
  cardEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    marginRight: 4,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 'auto',
    marginBottom: 40,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
    fontWeight: '500',
  },
});
