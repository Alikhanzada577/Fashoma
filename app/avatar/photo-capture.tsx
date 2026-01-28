import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CaptureStep = 'front' | 'side' | 'back';

interface StepConfig {
  title: string;
  instruction: string;
  step: number;
}

const STEPS: Record<CaptureStep, StepConfig> = {
  front: {
    title: 'Stand facing the camera',
    instruction: 'Align your shoulders with the markers',
    step: 1,
  },
  side: {
    title: 'Turn to your side',
    instruction: 'Align your hips with the markers',
    step: 2,
  },
  back: {
    title: 'Stand facing away',
    instruction: 'Ensure your body is within the markers',
    step: 3,
  },
};

const STEP_ORDER: CaptureStep[] = ['front', 'side', 'back'];

export default function PhotoCaptureScreen() {
  const params = useLocalSearchParams<{ mode: string }>();
  const isUploadMode = params.mode === 'upload';
  
  const [currentStep, setCurrentStep] = useState<CaptureStep>('front');
  const [photos, setPhotos] = useState<{ [key in CaptureStep]?: string }>({});
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [fontsLoaded] = useFonts({
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
  });

  useEffect(() => {
    if (isUploadMode) {
      // For upload mode, open gallery immediately
      pickImage();
    }
  }, [isUploadMode]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handlePhotoTaken(result.assets[0].uri);
    }
  };

  const handlePhotoTaken = (uri: string) => {
    const newPhotos = { ...photos, [currentStep]: uri };
    setPhotos(newPhotos);

    // Move to next step or complete
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
      if (isUploadMode) {
        // Small delay before opening gallery again
        setTimeout(() => pickImage(), 500);
      }
    } else {
      // All photos captured
      handleComplete(newPhotos);
    }
  };

  const handleComplete = (capturedPhotos: { [key in CaptureStep]?: string }) => {
    console.log('All photos captured:', capturedPhotos);
    // Navigate to processing screen with photos
    router.replace({
      pathname: '/avatar/processing',
      params: {
        frontPhoto: capturedPhotos.front || '',
        sidePhoto: capturedPhotos.side || '',
        backPhoto: capturedPhotos.back || '',
      },
    });
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        if (photo?.uri) {
          handlePhotoTaken(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const retakePhoto = () => {
    const newPhotos = { ...photos };
    delete newPhotos[currentStep];
    setPhotos(newPhotos);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!fontsLoaded) {
    return null;
  }

  // Handle permission not granted
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted && !isUploadMode) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stepConfig = STEPS[currentStep];
  const hasCurrentPhoto = !!photos[currentStep];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Camera View or Photo Preview */}
      {hasCurrentPhoto ? (
        <Image source={{ uri: photos[currentStep] }} style={styles.camera} />
      ) : isUploadMode ? (
        <View style={[styles.camera, styles.uploadPlaceholder]}>
          <Ionicons name="images-outline" size={64} color={Colors.white} />
          <Text style={styles.uploadPlaceholderText}>Select {stepConfig.title}</Text>
        </View>
      ) : (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          {/* Overlay UI */}
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>ALIGNMENT MODE</Text>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Alignment Markers */}
            <View style={styles.alignmentContainer}>
              {/* Shoulder markers for front view */}
              <View style={styles.shoulderMarkers}>
                <View style={[styles.marker, styles.markerLeft]} />
                <View style={[styles.marker, styles.markerRight]} />
              </View>

              {/* Body outline guide */}
              <View style={styles.bodyGuide} />
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>STEP {stepConfig.step} OF 3</Text>
              <Text style={styles.stepTitle}>{stepConfig.title}</Text>
              
              {/* Progress dots */}
              <View style={styles.progressDots}>
                {STEP_ORDER.map((step, index) => (
                  <View
                    key={step}
                    style={[
                      styles.progressDot,
                      index <= STEP_ORDER.indexOf(currentStep) && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Instruction */}
            <View style={styles.instructionContainer}>
              <Text style={styles.instruction}>{stepConfig.instruction}</Text>
            </View>
          </View>
        </CameraView>
      )}

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Gallery Button */}
        <TouchableOpacity style={styles.sideButton} onPress={pickImage}>
          <Ionicons name="images-outline" size={28} color={Colors.white} />
        </TouchableOpacity>

        {/* Shutter / Retake Button */}
        {hasCurrentPhoto ? (
          <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
            <Ionicons name="refresh" size={32} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.shutterButton}
            onPress={isUploadMode ? pickImage : takePicture}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        )}

        {/* Flip Camera Button */}
        <TouchableOpacity style={styles.sideButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse-outline" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
    letterSpacing: 1.5,
  },
  infoButton: {
    padding: 8,
  },
  alignmentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shoulderMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH * 0.6,
    position: 'absolute',
    top: '20%',
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 200, 150, 0.8)',
  },
  markerLeft: {},
  markerRight: {},
  bodyGuide: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_HEIGHT * 0.5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 100,
    borderStyle: 'dashed',
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepText: {
    fontSize: 11,
    fontFamily: 'ManropeMedium',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: Colors.white,
  },
  instructionContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 40,
    borderRadius: 8,
    marginBottom: 20,
  },
  instruction: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.white,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 40,
    backgroundColor: '#1a1a1a',
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  retakeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'ManropeRegular',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
  },
  uploadPlaceholder: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholderText: {
    fontSize: 18,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
    marginTop: 16,
  },
});
