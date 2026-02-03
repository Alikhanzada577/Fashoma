/**
 * Measurement Calculation Service
 * 
 * Calculates real body measurements from detected pose landmarks.
 * Uses pixel distances and standard body proportions to estimate cm values.
 * 
 * NO MANUAL INPUT NEEDED - everything is calculated from the detected pose.
 */

import { BodyLandmarks, BodyDimensions } from './pose.service';
import { AvatarMeasurements } from './avatar.storage.service';

/**
 * Reference measurements for calibration
 * Based on average human proportions
 */
const REFERENCE = {
  // Average human height in cm
  AVERAGE_HEIGHT_CM: 170,
  
  // Body part ratios relative to height
  HEAD_TO_HEIGHT_RATIO: 0.13,        // Head is ~13% of height
  SHOULDER_WIDTH_RATIO: 0.26,        // Shoulder width ~26% of height
  CHEST_CIRCUMFERENCE_RATIO: 0.55,   // Chest ~55% of height
  WAIST_CIRCUMFERENCE_RATIO: 0.43,   // Waist ~43% of height
  HIP_CIRCUMFERENCE_RATIO: 0.52,     // Hip ~52% of height
  INSEAM_RATIO: 0.45,                // Inseam ~45% of height
  
  // Width to circumference multipliers
  WIDTH_TO_CIRCUMFERENCE: 2.5,       // Rough multiplier for width to circumference
};

/**
 * Calculate distance between two landmarks (normalized 0-1)
 */
const calculateDistance = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Estimate user's height from landmarks
 * Uses nose-to-ankle distance and accounts for head above nose
 */
const estimateHeightFromLandmarks = (landmarks: BodyLandmarks): number => {
  const noseY = landmarks.nose.y;
  const avgAnkleY = (landmarks.leftAnkle.y + landmarks.rightAnkle.y) / 2;
  
  // Visible body ratio (nose to ankle)
  const visibleRatio = avgAnkleY - noseY;
  
  // Add head above nose (~6% of total height)
  const totalRatio = visibleRatio / 0.87; // nose is at ~13% from top, ankle at ~100%
  
  // Estimate height - assume average proportions
  // If the person fills 80% of the frame vertically, use reference height
  const estimatedHeight = REFERENCE.AVERAGE_HEIGHT_CM * (totalRatio / 0.87);
  
  // Clamp to reasonable range
  return Math.max(150, Math.min(200, estimatedHeight));
};

/**
 * Calculate body measurements from detected landmarks
 * Returns measurements in cm
 */
export const calculateMeasurementsFromLandmarks = (
  landmarks: BodyLandmarks,
  bodyDimensions: BodyDimensions
): AvatarMeasurements => {
  // Estimate user's height
  const estimatedHeight = estimateHeightFromLandmarks(landmarks);
  
  console.log('Estimated height from landmarks:', estimatedHeight.toFixed(1), 'cm');
  
  // Calculate shoulder width
  // Use detected shoulder width ratio and convert to cm
  const shoulderWidthRatio = bodyDimensions.shoulderWidth; // normalized 0-1
  // Shoulder width is typically 26% of height for average person
  // Adjust based on detected ratio vs expected ratio
  const expectedShoulderRatio = 0.36; // What we expect in a T-pose image
  const shoulderScaleFactor = shoulderWidthRatio / expectedShoulderRatio;
  const shoulderWidth = estimatedHeight * REFERENCE.SHOULDER_WIDTH_RATIO * shoulderScaleFactor;
  
  // Calculate chest circumference
  // Use shoulder width as reference (chest is roughly 2.2-2.5x shoulder width in circumference)
  const chestCircumference = shoulderWidth * REFERENCE.WIDTH_TO_CIRCUMFERENCE;
  
  // Calculate waist
  // Typically 75-80% of chest for average build
  const waistCircumference = chestCircumference * 0.85;
  
  // Calculate hips
  // Use detected hip width ratio
  const hipWidthRatio = bodyDimensions.hipWidth;
  const expectedHipRatio = 0.20;
  const hipScaleFactor = hipWidthRatio / expectedHipRatio;
  const hipCircumference = estimatedHeight * REFERENCE.HIP_CIRCUMFERENCE_RATIO * hipScaleFactor;
  
  // Calculate inseam (leg length)
  // Use detected leg length ratio
  const legLengthRatio = bodyDimensions.legLength;
  const inseam = estimatedHeight * legLengthRatio;
  
  const measurements: AvatarMeasurements = {
    shoulders: Math.round(shoulderWidth * 10) / 10,
    chest: Math.round(chestCircumference * 10) / 10,
    waist: Math.round(waistCircumference * 10) / 10,
    hips: Math.round(hipCircumference * 10) / 10,
    inseam: Math.round(inseam * 10) / 10,
  };
  
  console.log('Calculated measurements from pose:', measurements);
  
  return measurements;
};

/**
 * Validate that calculated measurements are within reasonable ranges
 */
export const validateMeasurements = (measurements: AvatarMeasurements): {
  valid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  // Reasonable ranges (in cm)
  const ranges = {
    shoulders: { min: 35, max: 60 },
    chest: { min: 70, max: 150 },
    waist: { min: 55, max: 130 },
    hips: { min: 70, max: 140 },
    inseam: { min: 60, max: 100 },
  };
  
  Object.entries(measurements).forEach(([key, value]) => {
    const range = ranges[key as keyof typeof ranges];
    if (value < range.min) {
      issues.push(`${key} seems too small (${value}cm)`);
    } else if (value > range.max) {
      issues.push(`${key} seems too large (${value}cm)`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
};

/**
 * Get a size recommendation based on measurements and size chart
 */
export const getRecommendedSize = (
  measurements: AvatarMeasurements,
  sizeChart: Record<string, { chest?: number; waist?: number; hips?: number }>,
  garmentType: 'top' | 'bottom'
): string => {
  const sizes = Object.keys(sizeChart);
  let bestSize = sizes[Math.floor(sizes.length / 2)]; // Default to middle size
  let bestDiff = Infinity;
  
  const primaryMeasurement = garmentType === 'top' ? measurements.chest : measurements.hips;
  const measurementKey = garmentType === 'top' ? 'chest' : 'hips';
  
  sizes.forEach((size) => {
    const sizeValue = sizeChart[size][measurementKey];
    if (sizeValue) {
      const diff = Math.abs(primaryMeasurement - sizeValue);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSize = size;
      }
    }
  });
  
  return bestSize;
};
