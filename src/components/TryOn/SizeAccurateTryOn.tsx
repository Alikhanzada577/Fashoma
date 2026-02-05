/**
 * Size-Accurate Try-On Component
 * 
 * Shows the product at its REAL proportional size relative to the user's body.
 * Does NOT stretch or warp the product to fit the user.
 * Instead, shows how the actual garment size would look on the user.
 * 
 * Key features:
 * - Calculates pixel-to-cm ratio from user's known measurements
 * - Renders product at correct real-world size
 * - Shows fit indicators (too tight, good fit, loose)
 * - Displays measurement comparison overlay
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Image, Text, ImageSourcePropType } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { AvatarMeasurements } from '@/services/avatar.storage.service';
import { BodyLandmarks, BodyDimensions } from '@/services/pose.service';
import { Product, ProductSize, FitStatus, ImageSource } from '@/config/products.types';
import { analyzeProductFit, getFitStatusColor } from '@/services/fit.service';

/**
 * Helper to convert ImageSource to proper React Native Image source
 * Handles both local require() results (numbers) and remote URLs (strings)
 */
const getImageSource = (source: ImageSource | undefined | null): ImageSourcePropType | undefined => {
  if (!source) return undefined;
  // If it's a number, it's a local require() result - pass directly
  if (typeof source === 'number') {
    return source as ImageSourcePropType;
  }
  // If it's a string, it's a remote URI
  return { uri: source };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RENDERER_HEIGHT = 450;
const RENDERER_WIDTH = SCREEN_WIDTH - 48;

interface SizeAccurateTryOnProps {
  /** User's photo URI */
  userPhotoUri?: string | null;
  /** Detected landmarks */
  landmarks?: BodyLandmarks | null;
  /** Calculated body dimensions */
  bodyDimensions?: BodyDimensions | null;
  /** User's measurements in cm */
  userMeasurements: AvatarMeasurements;
  /** Product to try on */
  product: Product;
  /** Selected size */
  selectedSize: ProductSize;
  /** Product image URI */
  productImageUri?: string;
  /** Whether to show measurement overlay */
  showMeasurements?: boolean;
  /** Whether to show fit indicator */
  showFitIndicator?: boolean;
}

/**
 * Calculate the pixel-to-cm ratio based on user's shoulder width
 * This allows us to convert real-world cm measurements to screen pixels
 */
const calculatePixelToCmRatio = (
  landmarks: BodyLandmarks | null | undefined,
  userMeasurements: AvatarMeasurements,
  containerWidth: number
): number => {
  if (!landmarks || !userMeasurements.shoulders) {
    // Default ratio if we don't have landmarks
    return containerWidth / 50; // Assume 50cm shoulder width
  }

  // Calculate shoulder width in pixels from landmarks (normalized 0-1)
  const shoulderWidthNormalized = Math.abs(
    landmarks.rightShoulder.x - landmarks.leftShoulder.x
  );
  const shoulderWidthPixels = shoulderWidthNormalized * containerWidth;

  // Pixel to cm ratio: pixels / cm
  const pixelToCmRatio = shoulderWidthPixels / userMeasurements.shoulders;

  return pixelToCmRatio;
};

/**
 * Calculate product position and size in real proportions
 */
const calculateProductRealSize = (
  landmarks: BodyLandmarks | null | undefined,
  userMeasurements: AvatarMeasurements,
  productSize: ProductSize,
  containerWidth: number,
  containerHeight: number
): { left: number; top: number; width: number; height: number } => {
  const pixelToCmRatio = calculatePixelToCmRatio(
    landmarks,
    userMeasurements,
    containerWidth
  );

  // Convert product measurements from cm to pixels
  const productWidthPx = productSize.shoulderWidth * pixelToCmRatio;
  const productHeightPx = productSize.length * pixelToCmRatio;

  // Position: center on shoulders
  let centerX = containerWidth / 2;
  let shoulderY = containerHeight * 0.15; // Default position

  if (landmarks) {
    // Use actual shoulder center
    centerX =
      ((landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2) *
      containerWidth;
    shoulderY =
      ((landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2) *
      containerHeight;
  }

  return {
    left: centerX - productWidthPx / 2,
    top: shoulderY - productHeightPx * 0.05, // Slight offset for neckline
    width: productWidthPx,
    height: productHeightPx,
  };
};

/**
 * Calculate user body outline for comparison
 */
const calculateUserBodyOutline = (
  landmarks: BodyLandmarks | null | undefined,
  userMeasurements: AvatarMeasurements,
  containerWidth: number,
  containerHeight: number
): { left: number; top: number; width: number; height: number } | null => {
  if (!landmarks) return null;

  const pixelToCmRatio = calculatePixelToCmRatio(
    landmarks,
    userMeasurements,
    containerWidth
  );

  // User's shoulder width in pixels
  const userWidthPx = userMeasurements.shoulders * pixelToCmRatio;

  // User's torso area
  const shoulderY =
    ((landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2) *
    containerHeight;
  const hipY =
    ((landmarks.leftHip.y + landmarks.rightHip.y) / 2) * containerHeight;
  const torsoHeight = hipY - shoulderY;

  const centerX =
    ((landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2) *
    containerWidth;

  return {
    left: centerX - userWidthPx / 2,
    top: shoulderY,
    width: userWidthPx,
    height: torsoHeight,
  };
};

const SizeAccurateTryOn: React.FC<SizeAccurateTryOnProps> = ({
  userPhotoUri,
  landmarks,
  bodyDimensions,
  userMeasurements,
  product,
  selectedSize,
  productImageUri,
  showMeasurements = true,
  showFitIndicator = true,
}) => {
  // Calculate product position at real size
  const productPosition = useMemo(
    () =>
      calculateProductRealSize(
        landmarks,
        userMeasurements,
        selectedSize,
        RENDERER_WIDTH,
        RENDERER_HEIGHT
      ),
    [landmarks, userMeasurements, selectedSize]
  );

  // Calculate user body outline
  const userOutline = useMemo(
    () =>
      calculateUserBodyOutline(
        landmarks,
        userMeasurements,
        RENDERER_WIDTH,
        RENDERER_HEIGHT
      ),
    [landmarks, userMeasurements]
  );

  // Analyze fit
  const fitAnalysis = useMemo(
    () => analyzeProductFit(userMeasurements, selectedSize),
    [userMeasurements, selectedSize]
  );

  const fitColor = getFitStatusColor(fitAnalysis.overallFit);

  // Get product image source - supports both local require() and remote URLs
  const productImageSource = useMemo(() => {
    if (productImageUri) {
      return { uri: productImageUri };
    }
    return getImageSource(product.imageUrl);
  }, [productImageUri, product.imageUrl]);

  // Debug logging
  console.log('SizeAccurateTryOn:', {
    productImageUrl: product.imageUrl,
    productImageUrlType: typeof product.imageUrl,
    productImageSource,
    hasUserPhoto: !!userPhotoUri,
    hasLandmarks: !!landmarks,
    productPosition,
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background} />

      {/* User's photo */}
      {userPhotoUri && (
        <Image
          source={{ uri: userPhotoUri }}
          style={styles.userPhoto}
          resizeMode="contain"
        />
      )}

      {/* Product overlay at real size */}
      <View
        style={[
          styles.productContainer,
          {
            left: productPosition.left,
            top: productPosition.top,
            width: productPosition.width,
            height: productPosition.height,
            borderColor: fitColor,
            borderWidth: showFitIndicator ? 3 : 0,
          },
        ]}
      >
        {productImageSource ? (
          <Image
            source={productImageSource}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.productPlaceholder, { backgroundColor: Colors.primary + '40' }]} />
        )}
      </View>

      {/* SVG overlay for measurements */}
      {showMeasurements && (
        <Svg
          width={RENDERER_WIDTH}
          height={RENDERER_HEIGHT}
          style={StyleSheet.absoluteFill}
        >
          {/* User body outline (dashed) */}
          {userOutline && (
            <Rect
              x={userOutline.left}
              y={userOutline.top}
              width={userOutline.width}
              height={userOutline.height}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={0.7}
            />
          )}

          {/* Shoulder width comparison line */}
          {landmarks && (
            <>
              {/* User shoulder line */}
              <Line
                x1={landmarks.leftShoulder.x * RENDERER_WIDTH}
                y1={landmarks.leftShoulder.y * RENDERER_HEIGHT - 20}
                x2={landmarks.rightShoulder.x * RENDERER_WIDTH}
                y2={landmarks.rightShoulder.y * RENDERER_HEIGHT - 20}
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
              <SvgText
                x={
                  ((landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2) *
                  RENDERER_WIDTH
                }
                y={landmarks.leftShoulder.y * RENDERER_HEIGHT - 25}
                fill="#FFFFFF"
                fontSize={10}
                textAnchor="middle"
              >
                You: {userMeasurements.shoulders}cm
              </SvgText>

              {/* Product shoulder line */}
              <Line
                x1={productPosition.left}
                y1={productPosition.top + 15}
                x2={productPosition.left + productPosition.width}
                y2={productPosition.top + 15}
                stroke={fitColor}
                strokeWidth={2}
              />
              <SvgText
                x={productPosition.left + productPosition.width / 2}
                y={productPosition.top + 30}
                fill={fitColor}
                fontSize={10}
                textAnchor="middle"
                fontWeight="bold"
              >
                {selectedSize.label}: {selectedSize.shoulderWidth}cm
              </SvgText>
            </>
          )}
        </Svg>
      )}

      {/* Fit indicator badge */}
      {showFitIndicator && (
        <View style={[styles.fitBadge, { backgroundColor: fitColor }]}>
          <Text style={styles.fitBadgeText}>
            {fitAnalysis.overallFit === 'good_fit'
              ? 'Good Fit'
              : fitAnalysis.overallFit === 'too_tight'
              ? 'Too Tight'
              : fitAnalysis.overallFit === 'snug'
              ? 'Snug Fit'
              : fitAnalysis.overallFit === 'relaxed'
              ? 'Relaxed'
              : 'Loose'}
          </Text>
        </View>
      )}

      {/* Size comparison info */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoPanelTitle}>{product.name}</Text>
        <Text style={styles.infoPanelSubtitle}>
          Size {selectedSize.label} • {selectedSize.shoulderWidth}cm shoulders •{' '}
          {selectedSize.chestWidth}cm chest
        </Text>
        <Text style={[styles.infoPanelFit, { color: fitColor }]}>
          {fitAnalysis.recommendation}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: RENDERER_WIDTH,
    height: RENDERER_HEIGHT + 80, // Extra space for info panel
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RENDERER_HEIGHT,
    backgroundColor: Colors.gray[50],
  },
  userPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RENDERER_WIDTH,
    height: RENDERER_HEIGHT,
  },
  productContainer: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  fitBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fitBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  infoPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  infoPanelSubtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoPanelFit: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SizeAccurateTryOn;
