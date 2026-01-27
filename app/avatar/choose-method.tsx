import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { PlayfairDisplay_400Regular_Italic, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope';
import { router } from 'expo-router';

type CaptureMethod = '360' | '3photos' | null;

export default function ChooseMethodScreen() {
  const [selectedMethod, setSelectedMethod] = useState<CaptureMethod>('360');

  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = () => {
    if (!selectedMethod) return;
    
    // Navigate to capture screen based on method
    if (selectedMethod === '360') {
      // router.push('/avatar/360-capture');
      alert('360° Video Scan selected');
    } else {
      // router.push('/avatar/photo-capture');
      alert('3 Photos selected');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray[50]} />
      
      {/* Close Button */}
      <View style={styles.headerSimple}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Choose Method</Text>
          <Text style={styles.subtitle}>
            Select how you'd like to create your{'\n'}avatar.
          </Text>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedMethod === '360' && styles.tabSelected,
            ]}
            onPress={() => setSelectedMethod('360')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              selectedMethod === '360' && styles.tabTextSelected,
            ]}>
              360° Video
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              selectedMethod === '3photos' && styles.tabSelected,
            ]}
            onPress={() => setSelectedMethod('3photos')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              selectedMethod === '3photos' && styles.tabTextSelected,
            ]}>
              3 Photos
            </Text>
          </TouchableOpacity>
        </View>

        {/* 360 Video Details Card */}
        {selectedMethod === '360' && (
          <View style={styles.detailsCard}>
            <View style={styles.videoIconContainer}>
              <Ionicons name="videocam" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.detailsTitle}>360° Video Scan</Text>
            <Text style={styles.detailsText}>
              Place phone on a surface and slowly{'\n'}
              turn 360° in front of it. Most accurate.
            </Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  headerSimple: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: Colors.gray[50],
  },
  closeButton: {
    padding: 4,
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: 999,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  tabSelected: {
    backgroundColor: Colors.white,
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  tabTextSelected: {
    color: Colors.text.primary,
    fontFamily: 'ManropeMedium',
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    flex: 1,
    marginBottom: 24,
  },
  videoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontFamily: 'ManropeMedium',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
    fontWeight: '500',
  },
});
