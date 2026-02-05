import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { router, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';
import EditableBodySilhouette from '@/components/Avatar/EditableBodySilhouette';
import { getAvatarData, storeAvatarMeasurements, getAvatarSegmentationMask, storeAdjustedLandmarks, getAdjustedLandmarks, clearAvatarData, AvatarMeasurements } from '@/services/avatar.storage.service';
import { BodyLandmarks } from '@/services/pose.service';
import { BaseMeasurements } from '@/services/outlineCalculation.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH - 64; // Account for padding

type PhotoView = 'front' | 'back' | 'side';

interface MeasurementItem {
  id: keyof AvatarMeasurements;
  label: string;
  min: number;
  max: number;
}

const MEASUREMENT_CONFIG: MeasurementItem[] = [
  { id: 'shoulders', label: 'Shoulders', min: 30, max: 60 },
  { id: 'chest', label: 'Chest', min: 70, max: 140 },
  { id: 'waist', label: 'Waist', min: 50, max: 120 },
  { id: 'hips', label: 'Hips', min: 70, max: 130 },
  { id: 'inseam', label: 'Inseam', min: 60, max: 100 },
];

export default function ReviewTwinScreen() {
  const params = useLocalSearchParams();
  const [selectedView, setSelectedView] = useState<PhotoView>('front');
  const [isEditMode, setIsEditMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expandedMeasurement, setExpandedMeasurement] = useState<string | null>(null);
  
  // Avatar data state
  const [landmarks, setLandmarks] = useState<BodyLandmarks | null>(null);
  const [baseMeasurements, setBaseMeasurements] = useState<BaseMeasurements | null>(null);
  const [currentMeasurements, setCurrentMeasurements] = useState<AvatarMeasurements | null>(null);
  const [segmentationMaskDataUrl, setSegmentationMaskDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storedFrontPhoto, setStoredFrontPhoto] = useState<string | null>(null);
  
  // Image dimensions for overlay
  const [previewDimensions, setPreviewDimensions] = useState({ width: PREVIEW_WIDTH, height: 360 });
  const [imageAspectRatio, setImageAspectRatio] = useState(0.75); // Default 3:4 portrait

  const [fontsLoaded] = useFonts({
    PlayfairDisplayRegular: PlayfairDisplay_400Regular,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
  });

  // Load avatar data on mount
  useEffect(() => {
    loadAvatarData();
  }, []);

  // Get image dimensions to calculate aspect ratio
  useEffect(() => {
    const frontPhoto = params.frontPhoto as string;
    if (frontPhoto) {
      Image.getSize(
        frontPhoto,
        (width, height) => {
          const ratio = width / height;
          console.log('Image dimensions:', width, height, 'Aspect ratio:', ratio);
          setImageAspectRatio(ratio);
        },
        (error) => {
          console.warn('Failed to get image size:', error);
          // Keep default 0.75 (3:4 portrait)
        }
      );
    }
  }, [params.frontPhoto]);

  const loadAvatarData = async () => {
    try {
      setIsLoading(true);
      const data = await getAvatarData();
      
      if (data) {
        if (data.photoUri) setStoredFrontPhoto(data.photoUri);
        
        // Load adjusted landmarks if available, otherwise use original
        const adjustedLandmarks = await getAdjustedLandmarks();
        if (adjustedLandmarks) {
          setLandmarks(adjustedLandmarks);
        } else if (data.landmarks) {
          setLandmarks(data.landmarks);
        }
        
        if (data.measurements) {
          setCurrentMeasurements(data.measurements);
          setBaseMeasurements({
            shoulders: data.measurements.shoulders,
            chest: data.measurements.chest,
            waist: data.measurements.waist,
            hips: data.measurements.hips,
            inseam: data.measurements.inseam,
          });
        }
      }
      const mask = await getAvatarSegmentationMask();
      if (mask) setSegmentationMaskDataUrl(mask);
    } catch (error) {
      console.error('Error loading avatar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle measurement change
  const handleMeasurementChange = useCallback((id: keyof AvatarMeasurements, value: number) => {
    setCurrentMeasurements(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [id]: Math.round(value * 10) / 10,
      };
    });
  }, []);

  // Increment/decrement handlers
  const handleIncrement = useCallback((id: keyof AvatarMeasurements) => {
    setCurrentMeasurements(prev => {
      if (!prev) return prev;
      const config = MEASUREMENT_CONFIG.find(m => m.id === id);
      if (!config) return prev;
      const newValue = Math.min(prev[id] + 0.5, config.max);
      return { ...prev, [id]: Math.round(newValue * 10) / 10 };
    });
  }, []);

  const handleDecrement = useCallback((id: keyof AvatarMeasurements) => {
    setCurrentMeasurements(prev => {
      if (!prev) return prev;
      const config = MEASUREMENT_CONFIG.find(m => m.id === id);
      if (!config) return prev;
      const newValue = Math.max(prev[id] - 0.5, config.min);
      return { ...prev, [id]: Math.round(newValue * 10) / 10 };
    });
  }, []);

  // Save measurements
  const handleSaveMeasurements = async () => {
    if (currentMeasurements) {
      try {
        await storeAvatarMeasurements(currentMeasurements);
        setIsEditMode(false);
      } catch (error) {
        console.error('Error saving measurements:', error);
      }
    }
  };

  // Handle preview layout to get dimensions (ensure non-zero for overlay)
  const handlePreviewLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setPreviewDimensions({ width, height });
    }
  }, []);

  // Handle landmark changes from the editable silhouette
  const handleLandmarksChange = useCallback((newLandmarks: BodyLandmarks) => {
    setLandmarks(newLandmarks);
    // Save adjusted landmarks to storage
    storeAdjustedLandmarks(newLandmarks);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  // Photos: prefer params, fallback to stored avatar photo for front
  const photos = {
    front: (params.frontPhoto as string) || storedFrontPhoto,
    back: params.backPhoto as string,
    side: params.sidePhoto as string,
  };

  // Show editable silhouette when on front view and we have landmarks
  const shouldShowSilhouette = selectedView === 'front' && !!landmarks;

  const handleConfirmProfile = async () => {
    // Save measurements before navigating
    if (currentMeasurements) {
      await storeAvatarMeasurements(currentMeasurements);
    }
    router.replace('/avatar/avatar-complete');
  };

  const handleRetakePhotos = () => {
    Alert.alert(
      'Retake Photos',
      'This will delete your current measurements and photos. You\'ll need to take new photos to get new measurements.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete & Retake',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all avatar data
              await clearAvatarData();
              // Navigate to the photo capture screen
              router.replace('/avatar/create-twin');
            } catch (error) {
              console.error('Error clearing avatar data:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggleEdit = () => {
    if (isEditMode) {
      // Save when exiting edit mode
      handleSaveMeasurements();
    } else {
      setIsEditMode(true);
    }
  };

  const navigatePrevious = () => {
    const views: PhotoView[] = ['front', 'back', 'side'];
    const currentIndex = views.indexOf(selectedView);
    if (currentIndex > 0) {
      setSelectedView(views[currentIndex - 1]);
    }
  };

  const navigateNext = () => {
    const views: PhotoView[] = ['front', 'back', 'side'];
    const currentIndex = views.indexOf(selectedView);
    if (currentIndex < 2) {
      setSelectedView(views[currentIndex + 1]);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={handleToggleEdit}>
            <Text style={styles.editText}>{isEditMode ? 'Done' : 'Edit'}</Text>
            <Ionicons name={isEditMode ? 'checkmark' : 'pencil'} size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Review Your Twin</Text>
          <Text style={styles.subtitle}>
            {isEditMode 
              ? 'Adjust your measurements using the sliders below.'
              : 'Verify your body scan details before proceeding.'}
          </Text>
        </View>

        {/* Avatar Preview with Outline Overlay */}
        <View style={styles.avatarContainer}>
          <View 
            style={styles.avatarPreview}
            onLayout={handlePreviewLayout}
          >
            {/* Show selected photo */}
            {photos[selectedView] ? (
              <>
                <Image 
                  source={{ uri: photos[selectedView] }} 
                  style={styles.mainPreviewImage} 
                  resizeMode="contain"
                />
                {/* Body silhouette - display only, not draggable */}
                {shouldShowSilhouette && landmarks && (
                  <View style={styles.outlineOverlayWrapper} pointerEvents="none">
                    <EditableBodySilhouette
                      landmarks={landmarks}
                      onLandmarksChange={handleLandmarksChange}
                      width={Math.max(1, previewDimensions.width)}
                      height={Math.max(1, previewDimensions.height)}
                      imageAspectRatio={imageAspectRatio}
                      editable={false}
                      strokeColor="#FFFFFF"
                      strokeWidth={2.5}
                      fillColor="rgba(80, 120, 100, 0.3)"
                      handleColor="#FFFFFF"
                      handleRadius={6}
                    />
                  </View>
                )}
              </>
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
                <View style={[
                  styles.thumbnailImageContainer,
                  selectedView === view && styles.thumbnailImageContainerSelected,
                ]}>
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

        {/* Measurements Panel */}
        {currentMeasurements && (
          <View style={styles.measurementsContainer}>
            <Text style={styles.measurementsTitle}>MEASUREMENTS</Text>
            
            {MEASUREMENT_CONFIG.map((item, index) => {
              const value = currentMeasurements[item.id];
              
              return (
                <View key={item.id} style={styles.measurementItem}>
                  <View style={styles.measurementHeader}>
                    <View style={styles.measurementLabelContainer}>
                      <Text style={styles.measurementIndex}>0{index + 1}</Text>
                      <Text style={styles.measurementLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.measurementValue}>
                      {value.toFixed(1)} <Text style={styles.unitText}>CM</Text>
                    </Text>
                  </View>

                  {/* Slider always visible in edit mode */}
                  {isEditMode && (
                    <View style={styles.sliderContainer}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => handleDecrement(item.id)}
                      >
                        <Ionicons name="remove" size={20} color={Colors.primary} />
                      </TouchableOpacity>

                      <Slider
                        style={styles.slider}
                        minimumValue={item.min}
                        maximumValue={item.max}
                        value={value}
                        onValueChange={(val) => handleMeasurementChange(item.id, val)}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.gray[200]}
                        thumbTintColor={Colors.primary}
                      />

                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => handleIncrement(item.id)}
                      >
                        <Ionicons name="add" size={20} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Confidence Score */}
        {!isEditMode && (
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
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>
              {isEditMode ? 'Save & Continue' : 'Confirm Profile'}
            </Text>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  outlineOverlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  thumbnailImageContainerSelected: {
    borderColor: Colors.primary,
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
  // Measurements Panel Styles
  measurementsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  measurementsTitle: {
    fontSize: 12,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  measurementItem: {
    paddingVertical: 12,
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
  // Confidence Score Styles
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
