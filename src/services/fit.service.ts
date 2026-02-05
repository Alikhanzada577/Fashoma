/**
 * Fit Calculation Service
 * 
 * Compares user body measurements to product measurements
 * to determine how well a garment will fit.
 */

import { AvatarMeasurements } from './avatar.storage.service';
import { 
  Product, 
  ProductSize, 
  FitStatus, 
  FitAnalysis, 
  FitRecommendation 
} from '@/config/products.types';

/**
 * Tolerance thresholds for fit calculations (in cm)
 * These define how much larger/smaller a garment should be than the body measurement
 */
const FIT_THRESHOLDS = {
  // Shoulders: product should be 0-4cm wider than body for good fit
  shoulders: {
    tooTight: -1,    // Product is smaller than body
    snug: 0,         // 0-2cm ease
    goodFit: 2,      // 2-4cm ease (ideal)
    relaxed: 4,      // 4-6cm ease
    loose: 6,        // 6+ cm ease
  },
  // Chest: product should be 4-10cm wider than body for good fit
  chest: {
    tooTight: 2,     // Less than 2cm ease
    snug: 4,         // 2-4cm ease
    goodFit: 6,      // 4-8cm ease (ideal)
    relaxed: 10,     // 8-12cm ease
    loose: 14,       // 12+ cm ease
  },
  // Length: product vs torso length
  length: {
    tooTight: -2,    // Too short
    snug: 0,         // Just covers
    goodFit: 4,      // Slight coverage
    relaxed: 8,      // Good coverage
    loose: 12,       // Long/oversized
  },
};

/**
 * Calculate fit status based on difference between product and user measurement
 */
export const calculateFitStatus = (
  measurementType: 'shoulders' | 'chest' | 'length',
  difference: number
): FitStatus => {
  const thresholds = FIT_THRESHOLDS[measurementType];
  
  if (difference < thresholds.tooTight) {
    return 'too_tight';
  } else if (difference < thresholds.snug) {
    return 'snug';
  } else if (difference < thresholds.goodFit) {
    return 'good_fit';
  } else if (difference < thresholds.relaxed) {
    return 'relaxed';
  } else {
    return 'loose';
  }
};

/**
 * Get human-readable description for a fit status
 */
export const getFitDescription = (
  measurementName: string,
  status: FitStatus,
  difference: number
): string => {
  const diffText = Math.abs(difference).toFixed(1);
  
  switch (status) {
    case 'too_tight':
      return `${measurementName} may be too tight (${diffText}cm smaller than your body)`;
    case 'snug':
      return `${measurementName} will fit snugly (+${diffText}cm)`;
    case 'good_fit':
      return `${measurementName} will fit well (+${diffText}cm ease)`;
    case 'relaxed':
      return `${measurementName} will have a relaxed fit (+${diffText}cm)`;
    case 'loose':
      return `${measurementName} will be loose/oversized (+${diffText}cm)`;
    default:
      return `${measurementName}: ${diffText}cm difference`;
  }
};

/**
 * Get overall fit status from multiple analyses
 */
export const getOverallFitStatus = (analyses: FitAnalysis[]): FitStatus => {
  // If any measurement is too tight, overall is too tight
  if (analyses.some(a => a.status === 'too_tight')) {
    return 'too_tight';
  }
  
  // Count each fit type
  const counts = analyses.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<FitStatus, number>);
  
  // Return the most common fit status
  const statusOrder: FitStatus[] = ['good_fit', 'snug', 'relaxed', 'loose', 'too_tight'];
  for (const status of statusOrder) {
    if (counts[status] && counts[status] >= analyses.length / 2) {
      return status;
    }
  }
  
  // Default to good_fit if mixed
  return 'good_fit';
};

/**
 * Get recommendation message based on overall fit
 */
export const getRecommendationMessage = (
  overallFit: FitStatus,
  sizeLabel: string
): string => {
  switch (overallFit) {
    case 'too_tight':
      return `Size ${sizeLabel} may be too small for you. Consider sizing up.`;
    case 'snug':
      return `Size ${sizeLabel} will fit close to your body. Good for a fitted look.`;
    case 'good_fit':
      return `Size ${sizeLabel} is your recommended fit!`;
    case 'relaxed':
      return `Size ${sizeLabel} will have a comfortable, relaxed fit.`;
    case 'loose':
      return `Size ${sizeLabel} will be oversized. Size down for a closer fit.`;
    default:
      return `Size ${sizeLabel} should work for you.`;
  }
};

/**
 * Analyze how well a specific product size fits the user
 */
export const analyzeProductFit = (
  userMeasurements: AvatarMeasurements,
  productSize: ProductSize
): FitRecommendation => {
  const analyses: FitAnalysis[] = [];
  
  // Analyze shoulders
  const shoulderDiff = productSize.shoulderWidth - userMeasurements.shoulders;
  const shoulderStatus = calculateFitStatus('shoulders', shoulderDiff);
  analyses.push({
    measurement: 'Shoulders',
    userValue: userMeasurements.shoulders,
    productValue: productSize.shoulderWidth,
    difference: shoulderDiff,
    status: shoulderStatus,
    description: getFitDescription('Shoulders', shoulderStatus, shoulderDiff),
  });
  
  // Analyze chest
  const chestDiff = productSize.chestWidth - userMeasurements.chest;
  const chestStatus = calculateFitStatus('chest', chestDiff);
  analyses.push({
    measurement: 'Chest',
    userValue: userMeasurements.chest,
    productValue: productSize.chestWidth,
    difference: chestDiff,
    status: chestStatus,
    description: getFitDescription('Chest', chestStatus, chestDiff),
  });
  
  // Analyze length (comparing to a typical torso measurement)
  // We'll use inseam as a proxy for height proportion
  const estimatedTorsoLength = userMeasurements.chest * 0.8; // Rough estimate
  const lengthDiff = productSize.length - estimatedTorsoLength;
  const lengthStatus = calculateFitStatus('length', lengthDiff);
  analyses.push({
    measurement: 'Length',
    userValue: estimatedTorsoLength,
    productValue: productSize.length,
    difference: lengthDiff,
    status: lengthStatus,
    description: getFitDescription('Length', lengthStatus, lengthDiff),
  });
  
  // Calculate overall fit
  const overallFit = getOverallFitStatus(analyses);
  
  // Calculate confidence based on how many measurements align
  const goodFitCount = analyses.filter(a => 
    a.status === 'good_fit' || a.status === 'snug' || a.status === 'relaxed'
  ).length;
  const confidence = Math.round((goodFitCount / analyses.length) * 100);
  
  return {
    size: productSize,
    analyses,
    overallFit,
    recommendation: getRecommendationMessage(overallFit, productSize.label),
    confidence,
  };
};

/**
 * Find the best fitting size for a product
 */
export const findBestFittingSize = (
  userMeasurements: AvatarMeasurements,
  product: Product
): FitRecommendation | null => {
  if (!product.sizes.length) return null;
  
  const recommendations = product.sizes.map(size => 
    analyzeProductFit(userMeasurements, size)
  );
  
  // Find the size with "good_fit" overall status
  const goodFit = recommendations.find(r => r.overallFit === 'good_fit');
  if (goodFit) return goodFit;
  
  // Otherwise find the snug fit
  const snugFit = recommendations.find(r => r.overallFit === 'snug');
  if (snugFit) return snugFit;
  
  // Otherwise find relaxed fit
  const relaxedFit = recommendations.find(r => r.overallFit === 'relaxed');
  if (relaxedFit) return relaxedFit;
  
  // Return the first size if no good match
  return recommendations[0];
};

/**
 * Get all size recommendations for a product
 */
export const getAllSizeRecommendations = (
  userMeasurements: AvatarMeasurements,
  product: Product
): FitRecommendation[] => {
  return product.sizes.map(size => analyzeProductFit(userMeasurements, size));
};

/**
 * Get fit status color for UI
 */
export const getFitStatusColor = (status: FitStatus): string => {
  switch (status) {
    case 'too_tight':
      return '#EF4444'; // Red
    case 'snug':
      return '#F59E0B'; // Amber
    case 'good_fit':
      return '#22C55E'; // Green
    case 'relaxed':
      return '#3B82F6'; // Blue
    case 'loose':
      return '#8B5CF6'; // Purple
    default:
      return '#6B7280'; // Gray
  }
};

/**
 * Get fit status icon name (Ionicons)
 */
export const getFitStatusIcon = (status: FitStatus): string => {
  switch (status) {
    case 'too_tight':
      return 'warning';
    case 'snug':
      return 'remove-circle';
    case 'good_fit':
      return 'checkmark-circle';
    case 'relaxed':
      return 'add-circle';
    case 'loose':
      return 'expand';
    default:
      return 'help-circle';
  }
};
