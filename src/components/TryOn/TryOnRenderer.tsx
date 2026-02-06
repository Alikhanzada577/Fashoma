/**
 * 2.5D Try-On Renderer Component
 * 
 * Renders a layered view of:
 * 1. Base layer: User's T-pose photo or body placeholder
 * 2. Garment layer: Real garment image positioned on detected body landmarks
 * 
 * Uses MediaPipe detected landmarks for accurate garment positioning.
 */

import React from 'react';
import { View, StyleSheet, Dimensions, Image, ImageSourcePropType } from 'react-native';
import { Colors } from '@/constants/Colors';
import { AvatarMeasurements } from '@/services/avatar.storage.service';
import { BodyLandmarks, BodyDimensions } from '@/services/pose.service';
import { GarmentType } from '@/config/bodyRegions.config';
import { SizeChart } from '@/data/mockProducts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RENDERER_HEIGHT = 450;
const RENDERER_WIDTH = SCREEN_WIDTH - 48;

interface TryOnRendererProps {
  userMeasurements: AvatarMeasurements;
  garmentType: GarmentType;
  selectedSize: string;
  sizeChart: SizeChart;
  // Real garment image
  garmentImage?: ImageSourcePropType;
  // Fallback color
  garmentColor: string;
  // User's T-pose photo
  userPhotoUri?: string | null;
  // Detected landmarks for positioning
  landmarks?: BodyLandmarks | null;
  bodyDimensions?: BodyDimensions | null;
}

/**
 * Calculate garment position and size from landmarks
 */
const calculateGarmentPosition = (
  landmarks: BodyLandmarks | null | undefined,
  bodyDimensions: BodyDimensions | null | undefined,
  garmentType: GarmentType,
  userMeasurements: AvatarMeasurements,
  sizeChart: SizeChart,
  selectedSize: string
): { left: number; top: number; width: number; height: number } => {
  const sizeData = sizeChart[selectedSize];
  
  if (landmarks && bodyDimensions) {
    // Use detected landmarks for precise positioning
    if (garmentType === 'top' || garmentType === 'outerwear') {
      const { leftShoulder, rightShoulder, leftHip, rightHip, leftElbow, rightElbow } = landmarks;
      
      // Calculate body center and key positions
      const bodyCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipY = (leftHip.y + rightHip.y) / 2;
      
      // Torso height in normalized coordinates
      const torsoHeight = Math.abs(hipY - shoulderY);
      
      // Collect all x-coordinates to find the true left and right extents
      // (MediaPipe "left/right" is from person's perspective, not camera's)
      const allXCoords = [leftShoulder.x, rightShoulder.x];
      if (leftElbow) allXCoords.push(leftElbow.x);
      if (rightElbow) allXCoords.push(rightElbow.x);
      
      const minX = Math.min(...allXCoords);
      const maxX = Math.max(...allXCoords);
      const armSpan = Math.abs(maxX - minX);
      
      // Scale based on user measurements vs size chart
      let scaleX = 1;
      if (sizeData?.chest && userMeasurements.chest) {
        scaleX = Math.max(0.9, Math.min(1.15, userMeasurements.chest / sizeData.chest));
      }
      
      // T-shirt dimensions based on detected body
      // Width: cover from elbow to elbow (arm span + padding for sleeves)
      const garmentWidth = Math.max((armSpan * 1.2) * RENDERER_WIDTH * scaleX, RENDERER_WIDTH * 0.5);
      
      // Height: match the torso height (shoulder to hip) + some extra for a natural fit
      // T-shirt typically ends slightly below the hip
      const garmentHeight = (torsoHeight + 0.08) * RENDERER_HEIGHT;
      
      // Position: center horizontally, start slightly above shoulders (for neckline)
      const left = (bodyCenterX * RENDERER_WIDTH) - (garmentWidth / 2);
      const top = (shoulderY - 0.03) * RENDERER_HEIGHT;
      
      return { left, top, width: garmentWidth, height: garmentHeight };
    } else {
      // Pants alignment (all coordinates normalized 0–1):
      // - TOP of pants (waistband) = leftHip.y & rightHip.y (average)  → hipY
      // - BOTTOM of pants (hem)    = leftAnkle.y & rightAnkle.y       → ankleY
      // - HORIZONTAL center        = (leftHip.x + rightHip.x) / 2     → hipCenterX
      // - WIDTH                    = from leftHip.x to rightHip.x     → detectedHipWidth
      const { leftHip, rightHip, leftAnkle, rightAnkle } = landmarks;
      
      const hipCenterX = (leftHip.x + rightHip.x) / 2;
      const hipY = (leftHip.y + rightHip.y) / 2;
      const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
      
      const detectedHipWidth = Math.abs(rightHip.x - leftHip.x);
      
      let scaleX = 1;
      if (sizeData?.hips && userMeasurements.hips) {
        scaleX = Math.max(0.85, Math.min(1.15, userMeasurements.hips / sizeData.hips));
      }
      
      // Width: based on hip width
      const garmentWidth = Math.max(
        detectedHipWidth * 1.9 * RENDERER_WIDTH * scaleX,
        RENDERER_WIDTH * 0.4
      );
      
      // Height: hip to ankle + extra length (e.g. break on shoe / slight drape)
      const extraLengthNorm = 0.04; // ~4% of frame below ankle
      const legLengthNorm = (ankleY - hipY) + extraLengthNorm;
      const garmentHeight = legLengthNorm * RENDERER_HEIGHT;
      
      const left = (hipCenterX * RENDERER_WIDTH) - (garmentWidth / 2);
      const top = hipY * RENDERER_HEIGHT;
      
      return { left, top, width: garmentWidth, height: garmentHeight };
    }
  }
  
  // Fallback: centered positioning
  if (garmentType === 'top') {
    return {
      left: RENDERER_WIDTH * 0.15,
      top: RENDERER_HEIGHT * 0.12,
      width: RENDERER_WIDTH * 0.7,
      height: RENDERER_HEIGHT * 0.45,
    };
  } else {
    return {
      left: RENDERER_WIDTH * 0.2,
      top: RENDERER_HEIGHT * 0.45,
      width: RENDERER_WIDTH * 0.6,
      height: RENDERER_HEIGHT * 0.5,
    };
  }
};

export const TryOnRenderer: React.FC<TryOnRendererProps> = ({
  userMeasurements,
  garmentType,
  selectedSize,
  sizeChart,
  garmentImage,
  garmentColor,
  userPhotoUri,
  landmarks,
  bodyDimensions,
}) => {
  const garmentPosition = calculateGarmentPosition(
    landmarks,
    bodyDimensions,
    garmentType,
    userMeasurements,
    sizeChart,
    selectedSize
  );

  // Debug logging
  console.log('TryOnRenderer:', {
    hasLandmarks: !!landmarks,
    hasBodyDimensions: !!bodyDimensions,
    hasGarmentImage: !!garmentImage,
    garmentPosition,
    userPhotoUri: userPhotoUri ? 'present' : 'missing',
  });

  return (
    <View style={styles.container}>
      {/* Layer 0: Background */}
      <View style={styles.background} />

      {/* Layer 1: User's T-pose photo */}
      {userPhotoUri ? (
        <Image
          source={{ uri: userPhotoUri }}
          style={styles.userPhoto}
          resizeMode="contain"
        />
      ) : (
        // Fallback: Body placeholder silhouette
        <View style={styles.bodyPlaceholderContainer}>
          <View style={styles.bodyPlaceholder}>
            <View style={styles.head} />
            <View style={styles.armsContainer}>
              <View style={styles.arm} />
              <View style={styles.torsoConnector} />
              <View style={styles.arm} />
            </View>
            <View style={styles.torso} />
            <View style={styles.legsContainer}>
              <View style={styles.leg} />
              <View style={styles.leg} />
            </View>
          </View>
        </View>
      )}

      {/* Layer 2: Garment overlay */}
      <View
        style={[
          styles.garmentContainer,
          {
            left: garmentPosition.left,
            top: garmentPosition.top,
            width: garmentPosition.width,
            height: garmentPosition.height,
          },
        ]}
      >
        {garmentImage ? (
          // Real garment image
          <Image
            source={garmentImage}
            style={styles.garmentImage}
            resizeMode="contain"
          />
        ) : (
          // Fallback: colored placeholder
          <View
            style={[
              styles.garmentPlaceholder,
              {
                backgroundColor: garmentColor,
                borderRadius: garmentType === 'top' ? 12 : 8,
              },
            ]}
          />
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: RENDERER_WIDTH,
    height: RENDERER_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.gray[50],
  },
  userPhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  bodyPlaceholderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyPlaceholder: {
    alignItems: 'center',
    opacity: 0.3,
  },
  head: {
    width: 50,
    height: 55,
    borderRadius: 25,
    backgroundColor: Colors.gray[400],
    marginBottom: 5,
  },
  armsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -10,
  },
  arm: {
    width: 90,
    height: 22,
    backgroundColor: Colors.gray[400],
    borderRadius: 11,
  },
  torsoConnector: {
    width: 110,
    height: 22,
    backgroundColor: Colors.gray[400],
  },
  torso: {
    width: 110,
    height: 130,
    backgroundColor: Colors.gray[400],
    borderRadius: 10,
    marginTop: -5,
  },
  legsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -5,
  },
  leg: {
    width: 45,
    height: 150,
    backgroundColor: Colors.gray[400],
    borderRadius: 10,
  },
  garmentContainer: {
    position: 'absolute',
  },
  garmentImage: {
    width: '100%',
    height: '100%',
  },
  garmentPlaceholder: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
});

export default TryOnRenderer;
