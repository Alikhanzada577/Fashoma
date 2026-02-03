/**
 * Fit Service
 * 
 * Compares user measurements against garment size chart to determine fit.
 * Returns Green / Amber / Red status with human-readable explanation.
 * 
 * All logic runs on device. No body data is sent anywhere.
 */

import { AvatarMeasurements } from './avatar.storage.service';
import { SizeChart } from '@/data/mockProducts';
import { GarmentType } from '@/config/bodyRegions.config';

export type FitStatus = 'green' | 'amber' | 'red';

export interface FitResult {
  status: FitStatus;
  title: string;
  explanation: string;
  details: FitDetail[];
}

export interface FitDetail {
  measurement: string;
  userValue: number;
  garmentValue: number;
  difference: number;
  status: FitStatus;
}

// Tolerance thresholds in cm
const THRESHOLDS = {
  GREEN: 3,   // Within ±3cm = good fit
  AMBER: 6,   // Within ±6cm = may feel snug or loose
  // Beyond 6cm = poor fit (red)
};

/**
 * Calculate fit for a specific measurement
 */
const calculateMeasurementFit = (
  measurementName: string,
  userValue: number,
  garmentValue: number
): FitDetail => {
  const difference = userValue - garmentValue;
  const absDiff = Math.abs(difference);
  
  let status: FitStatus;
  if (absDiff <= THRESHOLDS.GREEN) {
    status = 'green';
  } else if (absDiff <= THRESHOLDS.AMBER) {
    status = 'amber';
  } else {
    status = 'red';
  }
  
  return {
    measurement: measurementName,
    userValue,
    garmentValue,
    difference,
    status,
  };
};

/**
 * Get relevant measurements for a garment type
 */
const getRelevantMeasurements = (garmentType: GarmentType): (keyof AvatarMeasurements)[] => {
  switch (garmentType) {
    case 'top':
    case 'outerwear':
      return ['chest', 'waist', 'shoulders'];
    case 'bottom':
      return ['hips', 'waist', 'inseam'];
    case 'dress':
      return ['chest', 'waist', 'hips'];
    default:
      return ['chest', 'waist'];
  }
};

/**
 * Generate human-readable explanation based on fit details
 */
const generateExplanation = (details: FitDetail[], garmentType: GarmentType): string => {
  const issues: string[] = [];
  const goodPoints: string[] = [];
  
  details.forEach(detail => {
    const name = detail.measurement.charAt(0).toUpperCase() + detail.measurement.slice(1);
    
    if (detail.status === 'green') {
      goodPoints.push(name.toLowerCase());
    } else if (detail.status === 'amber') {
      if (detail.difference > 0) {
        issues.push(`${name} may feel slightly snug`);
      } else {
        issues.push(`${name} may feel slightly loose`);
      }
    } else {
      if (detail.difference > 0) {
        issues.push(`${name} is likely too tight`);
      } else {
        issues.push(`${name} is likely too loose`);
      }
    }
  });
  
  if (issues.length === 0 && goodPoints.length > 0) {
    return `This size should fit well across ${goodPoints.join(', ')}.`;
  } else if (issues.length > 0) {
    return issues.join('. ') + '.';
  }
  
  return 'Fit information unavailable.';
};

/**
 * Generate fit title based on status
 */
const getFitTitle = (status: FitStatus): string => {
  switch (status) {
    case 'green':
      return 'Good Fit';
    case 'amber':
      return 'Consider Carefully';
    case 'red':
      return 'May Not Fit';
  }
};

/**
 * Calculate overall fit status from individual measurement statuses
 */
const calculateOverallStatus = (details: FitDetail[]): FitStatus => {
  if (details.some(d => d.status === 'red')) {
    return 'red';
  }
  if (details.some(d => d.status === 'amber')) {
    return 'amber';
  }
  return 'green';
};

/**
 * Main function: Calculate fit for a product and size
 */
export const calculateFit = (
  userMeasurements: AvatarMeasurements,
  sizeChart: SizeChart,
  selectedSize: string,
  garmentType: GarmentType
): FitResult => {
  const sizeData = sizeChart[selectedSize];
  
  if (!sizeData) {
    return {
      status: 'amber',
      title: 'Size Not Available',
      explanation: 'Size chart data not available for this size.',
      details: [],
    };
  }
  
  const relevantMeasurements = getRelevantMeasurements(garmentType);
  const details: FitDetail[] = [];
  
  relevantMeasurements.forEach(measurementKey => {
    const userValue = userMeasurements[measurementKey];
    const garmentValue = sizeData[measurementKey];
    
    if (userValue && garmentValue) {
      details.push(calculateMeasurementFit(measurementKey, userValue, garmentValue));
    }
  });
  
  if (details.length === 0) {
    return {
      status: 'amber',
      title: 'Limited Data',
      explanation: 'Not enough measurement data to determine fit accurately.',
      details: [],
    };
  }
  
  const overallStatus = calculateOverallStatus(details);
  
  return {
    status: overallStatus,
    title: getFitTitle(overallStatus),
    explanation: generateExplanation(details, garmentType),
    details,
  };
};

/**
 * Get color for fit status
 */
export const getFitStatusColor = (status: FitStatus): string => {
  switch (status) {
    case 'green':
      return '#22C55E'; // Green
    case 'amber':
      return '#F59E0B'; // Amber/Orange
    case 'red':
      return '#EF4444'; // Red
  }
};
