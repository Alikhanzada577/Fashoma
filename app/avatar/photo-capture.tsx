import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PoseDetectorWebView, PoseDetectorRef } from '@/components/PoseDetection/PoseDetectorWebView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Two photos: Front and Back
type PhotoStep = 'front' | 'back';

const STEP_CONFIG: Record<PhotoStep, { title: string; instruction: string; readyText: string }> = {
  front: {
    title: 'Front T-Pose',
    instruction: 'Stand facing the camera with arms out',
    readyText: '✓ Pose detected! Tap to capture',
  },
  back: {
    title: 'Back View',
    instruction: 'Turn around, back facing the camera (same pose)',
    readyText: '✓ Ready! Tap to capture',
  },
};

export default function PhotoCaptureScreen() {
  const params = useLocalSearchParams<{ mode: string }>();
  const isUploadMode = params.mode === 'upload';
  
  // Current step
  const [currentStep, setCurrentStep] = useState<PhotoStep>('front');
  
  // Captured photos
  const [photos, setPhotos] = useState<{ front: string | null; back: string | null }>({
    front: null,
    back: null,
  });
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  // Pose detection state
  const [isPoseDetected, setIsPoseDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [poseReady, setPoseReady] = useState(false);
  const poseDetectorRef = useRef<PoseDetectorRef>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [timerOption, setTimerOption] = useState<0 | 3 | 5>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const [fontsLoaded] = useFonts({
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
  });

  // Pulse animation for indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Start real-time pose detection (only for front photo)
  const startRealtimeDetection = useCallback(() => {
    if (detectionInterval.current) return;
    
    detectionInterval.current = setInterval(async () => {
      if (!cameraRef.current || !poseDetectorRef.current || isDetecting || photos[currentStep]) return;
      
      try {
        setIsDetecting(true);
        
        // Take a quick snapshot
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          skipProcessing: true,
        });
        
        if (photo?.uri) {
          // Detect pose in snapshot (only for front view)
          if (currentStep === 'front') {
            const result = await poseDetectorRef.current.detectPose(photo.uri);
            setIsPoseDetected(result.success && !!result.landmarks);
          } else {
            // For back photo, we don't need pose detection, just allow capture
            setIsPoseDetected(true);
          }
        }
      } catch (error) {
        // Silently fail
      } finally {
        setIsDetecting(false);
      }
    }, 2000);
  }, [isDetecting, photos, currentStep]);

  // Stop detection and countdown when component unmounts or photo is taken
  useEffect(() => {
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
        countdownTimeoutRef.current = null;
      }
    };
  }, []);

  // Start detection when pose detector is ready and camera is active
  useEffect(() => {
    if (poseReady && !isUploadMode && !photos[currentStep]) {
      startRealtimeDetection();
    } else if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
  }, [poseReady, isUploadMode, photos, currentStep, startRealtimeDetection]);

  // For back photo, auto-set pose detected since we can't detect back poses
  useEffect(() => {
    if (currentStep === 'back') {
      setIsPoseDetected(true);
    }
  }, [currentStep]);

  // Countdown timer: when it hits 0, capture
  useEffect(() => {
    if (countdown === null || countdown < 1) return;
    const value = countdown;
    const t = setTimeout(() => {
      if (value === 1) {
        captureRef.current?.();
        setCountdown(null);
      } else {
        setCountdown(value - 1);
      }
    }, 1000);
    countdownTimeoutRef.current = t;
    return () => {
      clearTimeout(t);
      countdownTimeoutRef.current = null;
    };
  }, [countdown]);

  useEffect(() => {
    if (isUploadMode) {
      pickImage();
    }
  }, [isUploadMode]);

  const handlePoseReady = () => {
    console.log('Pose detector ready for real-time detection');
    setPoseReady(true);
  };

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
    // Stop detection
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
    
    // Save photo for current step
    setPhotos(prev => ({ ...prev, [currentStep]: uri }));
    
    // Move to next step or complete
    if (currentStep === 'front') {
      // Move to back photo
      setTimeout(() => {
        setCurrentStep('back');
        setIsPoseDetected(true); // Back photo doesn't need pose detection
      }, 500);
    } else {
      // Both photos captured, navigate to processing
      handleComplete(photos.front!, uri);
    }
  };

  const handleComplete = (frontPhoto: string, backPhoto: string) => {
    console.log('Photos captured:', { frontPhoto, backPhoto });
    router.replace({
      pathname: '/avatar/processing',
      params: {
        frontPhoto,
        backPhoto,
      },
    });
  };

  const doCapture = async () => {
    if (!cameraRef.current) return;
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
  };

  captureRef.current = doCapture;

  const takePicture = () => {
    if (countdown !== null) return;
    if (timerOption > 0) {
      setCountdown(timerOption);
    } else {
      doCapture();
    }
  };

  const retakePhoto = () => {
    setPhotos(prev => ({ ...prev, [currentStep]: null }));
    setIsPoseDetected(currentStep === 'back');
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!fontsLoaded) {
    return null;
  }

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

  const currentPhoto = photos[currentStep];
  const hasPhoto = !!currentPhoto;
  const stepConfig = STEP_CONFIG[currentStep];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hidden Pose Detector */}
      <PoseDetectorWebView
        ref={poseDetectorRef}
        onReady={handlePoseReady}
        onError={(error) => console.warn('Pose detector error:', error)}
      />

      {/* Camera View or Photo Preview */}
      <View style={styles.cameraContainer}>
        {hasPhoto ? (
          <Image source={{ uri: currentPhoto }} style={styles.camera} />
        ) : isUploadMode ? (
          <View style={[styles.camera, styles.uploadPlaceholder]}>
            <Ionicons name="images-outline" size={64} color={Colors.white} />
            <Text style={styles.uploadPlaceholderText}>Select a T-Pose Photo</Text>
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            ratio="16:9"
          />
        )}

        {/* Overlay UI */}
        {!hasPhoto && !isUploadMode && (
          <View style={styles.overlay} pointerEvents="box-none">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color={Colors.white} />
              </TouchableOpacity>
              
              {/* Step Progress */}
              <View style={styles.stepProgress}>
                <View style={[styles.stepDot, currentStep === 'front' && styles.stepDotActive]} />
                <View style={styles.stepLine} />
                <View style={[styles.stepDot, currentStep === 'back' && styles.stepDotActive]} />
              </View>
              
              {/* Pose Detection Indicator */}
              <Animated.View 
                style={[
                  styles.poseIndicator,
                  isPoseDetected ? styles.poseDetected : styles.poseNotDetected,
                  { transform: [{ scale: isPoseDetected ? pulseAnim : 1 }] }
                ]}
              >
                <Ionicons 
                  name={isPoseDetected ? "checkmark-circle" : "scan-outline"} 
                  size={18} 
                  color={Colors.white} 
                />
              </Animated.View>
            </View>

            {/* Body Guide */}
            <View style={styles.alignmentContainer} pointerEvents="none">
              <View style={[
                styles.bodyGuide,
                isPoseDetected && styles.bodyGuideDetected
              ]} />
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator} pointerEvents="none">
              <Text style={styles.stepLabel}>
                {currentStep === 'front' ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
              </Text>
              <Text style={styles.stepTitle}>{stepConfig.title}</Text>
            </View>

            {/* Instruction */}
            <View style={[
              styles.instructionContainer,
              isPoseDetected && styles.instructionContainerDetected
            ]} pointerEvents="none">
              <Text style={styles.instruction}>
                {isPoseDetected 
                  ? stepConfig.readyText 
                  : stepConfig.instruction}
              </Text>
            </View>
          </View>
        )}

        {/* Photo Preview Overlay */}
        {hasPhoto && (
          <View style={styles.previewOverlay}>
            <Text style={styles.previewTitle}>
              {currentStep === 'front' ? 'Front Photo' : 'Back Photo'}
            </Text>
            <Text style={styles.previewSubtitle}>
              {currentStep === 'front' 
                ? 'Looking good! Ready for back photo.' 
                : 'Perfect! Ready to process.'}
            </Text>
          </View>
        )}

        {/* Countdown overlay */}
        {countdown !== null && countdown > 0 && (
          <View style={styles.countdownOverlay} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </View>

      {/* Timer selector - only when capturing (camera mode, no photo yet) */}
      {!hasPhoto && !isUploadMode && (
        <View style={styles.timerRow}>
          {([0, 3, 5] as const).map((seconds) => (
            <TouchableOpacity
              key={seconds}
              style={[
                styles.timerOption,
                timerOption === seconds && styles.timerOptionActive,
              ]}
              onPress={() => setTimerOption(seconds)}
              disabled={countdown !== null}
            >
              <Text
                style={[
                  styles.timerOptionText,
                  timerOption === seconds && styles.timerOptionTextActive,
                ]}
              >
                {seconds === 0 ? 'Instant' : `${seconds}s`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Gallery Button */}
        <TouchableOpacity style={styles.sideButton} onPress={pickImage}>
          <Ionicons name="images-outline" size={28} color={Colors.white} />
        </TouchableOpacity>

        {/* Shutter Button */}
        {hasPhoto ? (
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="refresh" size={24} color={Colors.white} />
              <Text style={styles.actionButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={() => {
                if (currentStep === 'front') {
                  setCurrentStep('back');
                } else {
                  handleComplete(photos.front!, photos.back!);
                }
              }}
            >
              <Text style={styles.continueButtonText}>
                {currentStep === 'front' ? 'Next' : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.shutterButton,
              (isPoseDetected || currentStep === 'back') && styles.shutterButtonReady
            ]}
            onPress={isUploadMode ? pickImage : takePicture}
            disabled={countdown !== null}
          >
            <View style={[
              styles.shutterInner,
              isPoseDetected && styles.shutterInnerReady
            ]} />
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
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
  // Step Progress
  stepProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  stepDotActive: {
    backgroundColor: '#22C55E',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  // Pose Indicator
  poseIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poseDetected: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  poseNotDetected: {
    backgroundColor: 'rgba(100, 100, 100, 0.8)',
  },
  alignmentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyGuide: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_HEIGHT * 0.55,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 120,
    borderStyle: 'dashed',
  },
  bodyGuideDetected: {
    borderColor: 'rgba(34, 197, 94, 0.7)',
    borderStyle: 'solid',
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'ManropeMedium',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
  },
  instructionContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionContainerDetected: {
    backgroundColor: 'rgba(34, 197, 94, 0.85)',
  },
  instruction: {
    fontSize: 15,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
    textAlign: 'center',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  countdownText: {
    fontSize: 120,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timerOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  timerOptionActive: {
    backgroundColor: Colors.primary,
  },
  timerOptionText: {
    fontSize: 14,
    fontFamily: 'ManropeMedium',
    color: 'rgba(255,255,255,0.8)',
  },
  timerOptionTextActive: {
    color: Colors.white,
  },
  // Preview Overlay
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: 'rgba(255,255,255,0.7)',
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
  shutterButtonReady: {
    borderColor: '#22C55E',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  shutterInnerReady: {
    backgroundColor: '#22C55E',
  },
  // Photo Actions
  photoActions: {
    flexDirection: 'row',
    gap: 16,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 25,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
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
