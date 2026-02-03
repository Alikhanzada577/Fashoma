import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { router, useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PhotoView = 'front' | 'back' | 'side';

export default function ReviewTwinScreen() {
  const params = useLocalSearchParams();
  const [selectedView, setSelectedView] = useState<PhotoView>('front');

  const [fontsLoaded] = useFonts({
    PlayfairDisplayRegular: PlayfairDisplay_400Regular,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Mock photos - in real app these would come from params
  const photos = {
    front: params.frontPhoto as string,
    back: params.backPhoto as string,
    side: params.sidePhoto as string,
  };

  const handleConfirmProfile = () => {
    // Go directly to complete - measurements are auto-detected
    router.replace('/avatar/avatar-complete');
  };

  const handleRetakePhotos = () => {
    router.back();
  };

  const handleEdit = () => {
    // Go directly to complete - NO manual entry
    router.replace('/avatar/avatar-complete');
  };

  const navigatePrevious = () => {
    const currentIndex = (['front', 'back', 'side'] as PhotoView[]).indexOf(selectedView);
    if (currentIndex > 0) {
      setSelectedView((['front', 'back', 'side'] as PhotoView[])[currentIndex - 1]);
    }
  };

  const navigateNext = () => {
    const currentIndex = (['front', 'back', 'side'] as PhotoView[]).indexOf(selectedView);
    if (currentIndex < 2) {
      setSelectedView((['front', 'back', 'side'] as PhotoView[])[currentIndex + 1]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray[50]} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editText}>Edit</Text>
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Review Your Twin</Text>
          <Text style={styles.subtitle}>
            Verify your body scan details before proceeding.
          </Text>
        </View>

        {/* 3D Avatar Preview */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPreview}>
            {/* Show selected photo */}
            {photos[selectedView] ? (
              <Image 
                source={{ uri: photos[selectedView] }} 
                style={styles.mainPreviewImage} 
                resizeMode="contain"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="body-outline" size={120} color={Colors.gray[400]} />
              </View>
            )}
            
            {/* Navigation Arrows */}
            <TouchableOpacity 
              style={[styles.navArrow, styles.navArrowLeft]} 
              onPress={navigatePrevious}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navArrow, styles.navArrowRight]}
              onPress={navigateNext}
            >
              <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Photo Thumbnails */}
          <View style={styles.thumbnailContainer}>
            {(['front', 'back', 'side'] as PhotoView[]).map((view) => (
              <TouchableOpacity
                key={view}
                style={[
                  styles.thumbnail,
                  selectedView === view && styles.thumbnailSelected,
                ]}
                onPress={() => setSelectedView(view)}
              >
                <View style={styles.thumbnailImageContainer}>
                  {photos[view] ? (
                    <Image source={{ uri: photos[view] }} style={styles.thumbnailImage} />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons name="person-outline" size={24} color={Colors.gray[400]} />
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.thumbnailLabel,
                  selectedView === view && styles.thumbnailLabelSelected,
                ]}>
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Confidence Score */}
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceContent}>
            <View>
              <Text style={styles.confidenceLabel}>CONFIDENCE SCORE</Text>
              <Text style={styles.confidenceValue}>94% Match</Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceBadgeText}>94</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetakePhotos}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.text.secondary} />
            <Text style={styles.retakeButtonText}>Retake Photos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerSpacer: {
    width: 60,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.primary,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplayRegular',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  avatarContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  avatarPreview: {
    height: 360,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  navArrow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navArrowLeft: {
    left: 12,
  },
  navArrowRight: {
    right: 12,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  thumbnail: {
    alignItems: 'center',
  },
  thumbnailSelected: {},
  thumbnailImageContainer: {
    width: 56,
    height: 72,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLabel: {
    fontSize: 11,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  thumbnailLabelSelected: {
    fontFamily: 'ManropeMedium',
    color: Colors.text.primary,
  },
  confidenceContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  confidenceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 11,
    fontFamily: 'ManropeMedium',
    color: Colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 18,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
  },
  confidenceBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceBadgeText: {
    fontSize: 16,
    fontFamily: 'ManropeSemiBold',
    color: Colors.primary,
  },
  actionButtons: {
    gap: 8,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  retakeButtonText: {
    fontSize: 15,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
});
