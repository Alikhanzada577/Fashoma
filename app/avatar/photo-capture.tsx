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

// Single photo capture - only front T-pose needed
const STEP_CONFIG = {
  title: 'Strike a T-Pose',
  instruction: 'Wait for green indicator, then capture',
};

export default function PhotoCaptureScreen() {
  const params = useLocalSearchParams<{ mode: string }>();
  const isUploadMode = params.mode === 'upload';
  
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
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

  // Start real-time pose detection
  const startRealtimeDetection = useCallback(() => {
    if (detectionInterval.current) return;
    
    detectionInterval.current = setInterval(async () => {
      if (!cameraRef.current || !poseDetectorRef.current || isDetecting || capturedPhoto) return;
      
      try {
        setIsDetecting(true);
        
        // Take a quick snapshot
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3, // Low quality for speed
          skipProcessing: true,
        });
        
        if (photo?.uri) {
          // Detect pose in snapshot
          const result = await poseDetectorRef.current.detectPose(photo.uri);
          setIsPoseDetected(result.success && !!result.landmarks);
        }
      } catch (error) {
        // Silently fail - don't spam errors
      } finally {
        setIsDetecting(false);
      }
    }, 2000); // Check every 2 seconds
  }, [isDetecting, capturedPhoto]);

  // Stop detection when component unmounts or photo is taken
  useEffect(() => {
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
    };
  }, []);

  // Start detection when pose detector is ready and camera is active
  useEffect(() => {
    if (poseReady && !isUploadMode && !capturedPhoto) {
      startRealtimeDetection();
    } else if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
  }, [poseReady, isUploadMode, capturedPhoto, startRealtimeDetection]);

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
    
    setCapturedPhoto(uri);
    handleComplete(uri);
  };

  const handleComplete = (photoUri: string) => {
    console.log('Photo captured:', photoUri);
    router.replace({
      pathname: '/avatar/processing',
      params: {
        frontPhoto: photoUri,
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
    setCapturedPhoto(null);
    setIsPoseDetected(false);
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

  const hasPhoto = !!capturedPhoto;

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
          <Image source={{ uri: capturedPhoto }} style={styles.camera} />
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
          />
        )}

        {/* Overlay UI - positioned absolutely over camera */}
        {!hasPhoto && !isUploadMode && (
          <View style={styles.overlay} pointerEvents="box-none">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color={Colors.white} />
              </TouchableOpacity>
              
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
                  size={20} 
                  color={Colors.white} 
                />
                <Text style={styles.poseIndicatorText}>
                  {isPoseDetected ? 'POSE DETECTED' : 'SCANNING...'}
                </Text>
              </Animated.View>
              
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.white} />
              </TouchableOpacity>
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
              <Text style={styles.stepTitle}>{STEP_CONFIG.title}</Text>
            </View>

            {/* Instruction */}
            <View style={[
              styles.instructionContainer,
              isPoseDetected && styles.instructionContainerDetected
            ]} pointerEvents="none">
              <Text style={styles.instruction}>
                {isPoseDetected 
                  ? '✓ Great! Tap the button to capture' 
                  : STEP_CONFIG.instruction}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Gallery Button */}
        <TouchableOpacity style={styles.sideButton} onPress={pickImage}>
          <Ionicons name="images-outline" size={28} color={Colors.white} />
        </TouchableOpacity>

        {/* Shutter Button */}
        {hasPhoto ? (
          <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
            <Ionicons name="refresh" size={32} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.shutterButton,
              isPoseDetected && styles.shutterButtonReady
            ]}
            onPress={isUploadMode ? pickImage : takePicture}
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
  infoButton: {
    padding: 8,
  },
  // Pose Indicator Styles
  poseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  poseDetected: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)', // Green
  },
  poseNotDetected: {
    backgroundColor: 'rgba(100, 100, 100, 0.8)', // Gray
  },
  poseIndicatorText: {
    fontSize: 11,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
    letterSpacing: 0.5,
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
    borderColor: 'rgba(34, 197, 94, 0.7)', // Green when detected
    borderStyle: 'solid',
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'ManropeSemiBold',
    color: Colors.white,
    marginBottom: 8,
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
    borderColor: '#22C55E', // Green border when ready
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  shutterInnerReady: {
    backgroundColor: '#22C55E', // Green when ready
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
