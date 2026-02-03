/**
 * Processing Screen
 * 
 * Uses MediaPipe to detect body pose from the captured T-pose image.
 * Automatically calculates measurements from detected landmarks.
 * NO MANUAL INPUT NEEDED.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { PlayfairDisplay_400Regular_Italic, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PoseDetectorWebView, PoseDetectorRef } from '@/components/PoseDetection/PoseDetectorWebView';
import { storeAvatarLandmarks, storeAvatarPhoto, storeAvatarMeasurements } from '@/services/avatar.storage.service';
import { calculateMeasurementsFromLandmarks, validateMeasurements } from '@/services/measurementCalculation.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProcessingScreen() {
  const params = useLocalSearchParams();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [processingStatus, setProcessingStatus] = useState('Initializing pose detection...');
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  const [detectionFailed, setDetectionFailed] = useState(false);
  const poseDetectorRef = useRef<PoseDetectorRef>(null);
  const hasProcessed = useRef(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
  });

  // Handle MediaPipe ready
  const handleMediaPipeReady = () => {
    console.log('MediaPipe is ready');
    setIsMediaPipeReady(true);
  };

  // Handle MediaPipe error
  const handleMediaPipeError = (error: string) => {
    console.error('MediaPipe error:', error);
    setProcessingStatus('Detection error. Please try again.');
    setDetectionFailed(true);
  };

  // Process the captured photo with real MediaPipe detection
  const processPhotoWithMediaPipe = async () => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    setDetectionFailed(false);

    try {
      const photoUri = params.frontPhoto as string;

      if (!photoUri) {
        console.warn('No photo URI provided');
        setProcessingStatus('No photo found. Please try again.');
        setDetectionFailed(true);
        return;
      }

      // Step 1: Store the photo
      setProcessingStatus('Storing your photo...');
      await storeAvatarPhoto(photoUri);

      // Step 2: Wait for MediaPipe to be ready (max 15 seconds)
      setProcessingStatus('Loading AI model...');
      let waitTime = 0;
      while (!poseDetectorRef.current && waitTime < 15000) {
        await new Promise(resolve => setTimeout(resolve, 500));
        waitTime += 500;
      }

      if (!poseDetectorRef.current) {
        console.warn('MediaPipe not ready after timeout');
        setProcessingStatus('AI model failed to load. Please try again.');
        setDetectionFailed(true);
        return;
      }

      // Step 3: Detect pose using MediaPipe
      setProcessingStatus('Detecting your body pose...');
      console.log('Starting pose detection for:', photoUri);

      const result = await poseDetectorRef.current.detectPose(photoUri);

      if (!result.success || !result.landmarks || !result.bodyDimensions) {
        console.warn('Pose detection failed:', result.message);
        setProcessingStatus('Could not detect pose in image');
        setDetectionFailed(true);
        return;
      }

      console.log('Pose detected successfully!');
      console.log('Body dimensions:', {
        shoulderWidth: (result.bodyDimensions.shoulderWidth * 100).toFixed(1) + '%',
        hipWidth: (result.bodyDimensions.hipWidth * 100).toFixed(1) + '%',
        torsoHeight: (result.bodyDimensions.torsoHeight * 100).toFixed(1) + '%',
        legLength: (result.bodyDimensions.legLength * 100).toFixed(1) + '%',
      });

      // Step 4: Calculate measurements from landmarks (NO MANUAL INPUT)
      setProcessingStatus('Calculating your measurements...');
      const measurements = calculateMeasurementsFromLandmarks(
        result.landmarks,
        result.bodyDimensions
      );

      // Validate measurements
      const validation = validateMeasurements(measurements);
      if (!validation.valid) {
        console.warn('Measurement validation issues:', validation.issues);
      }

      console.log('Auto-calculated measurements:', measurements);

      // Step 5: Store everything
      setProcessingStatus('Saving your avatar data...');
      await storeAvatarLandmarks(result.landmarks, result.bodyDimensions);
      await storeAvatarMeasurements(measurements);

      setProcessingStatus('Avatar created successfully!');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to completion (skip manual measurements screen)
      router.replace('/avatar/avatar-complete');

    } catch (error) {
      console.error('Error processing photo:', error);
      setProcessingStatus('An error occurred. Please try again.');
      setDetectionFailed(true);
    }
  };

  const handleRetry = () => {
    // Go back to photo capture to take a new photo
    router.replace('/avatar/photo-capture');
  };

  const handleSkip = () => {
    // Skip detection and go to completion (won't have measurements)
    router.replace('/avatar/avatar-complete');
  };

  // Start processing when MediaPipe is ready
  useEffect(() => {
    if (isMediaPipeReady && !hasProcessed.current) {
      processPhotoWithMediaPipe();
    }
  }, [isMediaPipeReady]);

  // Start animations
  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Rotate animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray[50]} />

      {/* Hidden WebView for MediaPipe */}
      <PoseDetectorWebView
        ref={poseDetectorRef}
        onReady={handleMediaPipeReady}
        onError={handleMediaPipeError}
      />

      <View style={styles.content}>
        {/* Animated Circles or Error Icon */}
        <View style={styles.animationContainer}>
          {detectionFailed ? (
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle-outline" size={80} color={Colors.gray[400]} />
            </View>
          ) : (
            <>
              <Animated.View
                style={[
                  styles.outerCircle,
                  {
                    opacity: pulseAnim,
                    transform: [{ rotate: spin }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.middleCircle,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.5, 0.8],
                    }),
                  },
                ]}
              />
              <View style={styles.innerCircle} />
            </>
          )}
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          {detectionFailed ? (
            <>
              <Text style={styles.title}>Detection Failed</Text>
              <Text style={styles.subtitle}>{processingStatus}</Text>
              <Text style={styles.hint}>
                Tips for better detection:{'\n'}
                • Show your full body (head to feet){'\n'}
                • Stand in a T-pose with arms extended{'\n'}
                • Use good lighting{'\n'}
                • Face the camera directly
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Analyzing your{'\n'}body pose</Text>
              <Text style={styles.subtitle}>{processingStatus}</Text>
            </>
          )}
        </View>

        {/* Action Buttons when failed */}
        {detectionFailed && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="camera-outline" size={20} color={Colors.white} />
              <Text style={styles.retryButtonText}>Take New Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  outerCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(143, 175, 154, 0.15)',
  },
  middleCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(143, 175, 154, 0.25)',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(143, 175, 154, 0.4)',
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  hint: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.tertiary,
    textAlign: 'left',
    lineHeight: 22,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.tertiary,
    textDecorationLine: 'underline',
  },
});
