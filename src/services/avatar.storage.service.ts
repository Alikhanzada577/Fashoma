/**
 * Avatar Storage Service
 * Handles storage of avatar data (measurements + photo + landmarks) on device only.
 * Uses AsyncStorage for larger data (landmarks can exceed SecureStore's 2KB limit).
 * No data is sent to any server.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BodyLandmarks, BodyDimensions } from './pose.service';

const STORAGE_KEYS = {
  AVATAR_DATA: '@fashoma_avatar_data',
} as const;

export interface AvatarMeasurements {
  shoulders: number; // cm
  chest: number;     // cm
  waist: number;     // cm
  hips: number;      // cm
  inseam: number;    // cm
}

export interface AvatarData {
  measurements: AvatarMeasurements;
  photoUri: string | null;
  landmarks: BodyLandmarks | null;      // Detected body landmarks from T-pose
  bodyDimensions: BodyDimensions | null; // Calculated dimensions from landmarks
  createdAt: string;
  updatedAt: string;
}

/**
 * Internal: Save avatar data
 */
const saveAvatarData = async (data: AvatarData): Promise<void> => {
  const jsonData = JSON.stringify(data);
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEYS.AVATAR_DATA, jsonData);
  } else {
    await AsyncStorage.setItem(STORAGE_KEYS.AVATAR_DATA, jsonData);
  }
};

/**
 * Store avatar measurements on device
 */
export const storeAvatarMeasurements = async (measurements: AvatarMeasurements): Promise<void> => {
  try {
    const data: AvatarData = {
      measurements,
      photoUri: null,
      landmarks: null,
      bodyDimensions: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Try to preserve existing data if any
    const existing = await getAvatarData();
    if (existing) {
      if (existing.photoUri) data.photoUri = existing.photoUri;
      if (existing.landmarks) data.landmarks = existing.landmarks;
      if (existing.bodyDimensions) data.bodyDimensions = existing.bodyDimensions;
      data.createdAt = existing.createdAt;
    }
    
    await saveAvatarData(data);
  } catch (error) {
    console.error('Error storing avatar measurements:', error);
    throw error;
  }
};

/**
 * Store avatar photo URI on device
 */
export const storeAvatarPhoto = async (photoUri: string): Promise<void> => {
  try {
    const existing = await getAvatarData();
    const data: AvatarData = existing || {
      measurements: { shoulders: 0, chest: 0, waist: 0, hips: 0, inseam: 0 },
      photoUri: null,
      landmarks: null,
      bodyDimensions: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    data.photoUri = photoUri;
    data.updatedAt = new Date().toISOString();
    
    await saveAvatarData(data);
  } catch (error) {
    console.error('Error storing avatar photo:', error);
    throw error;
  }
};

/**
 * Store avatar landmarks and body dimensions on device
 */
export const storeAvatarLandmarks = async (
  landmarks: BodyLandmarks,
  bodyDimensions: BodyDimensions
): Promise<void> => {
  try {
    const existing = await getAvatarData();
    const data: AvatarData = existing || {
      measurements: { shoulders: 0, chest: 0, waist: 0, hips: 0, inseam: 0 },
      photoUri: null,
      landmarks: null,
      bodyDimensions: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    data.landmarks = landmarks;
    data.bodyDimensions = bodyDimensions;
    data.updatedAt = new Date().toISOString();
    
    await saveAvatarData(data);
    console.log('Avatar landmarks stored successfully');
  } catch (error) {
    console.error('Error storing avatar landmarks:', error);
    throw error;
  }
};

/**
 * Get avatar landmarks
 */
export const getAvatarLandmarks = async (): Promise<BodyLandmarks | null> => {
  const data = await getAvatarData();
  return data?.landmarks || null;
};

/**
 * Get avatar body dimensions
 */
export const getAvatarBodyDimensions = async (): Promise<BodyDimensions | null> => {
  const data = await getAvatarData();
  return data?.bodyDimensions || null;
};

/**
 * Get avatar data (measurements + photo + landmarks)
 */
export const getAvatarData = async (): Promise<AvatarData | null> => {
  try {
    let jsonData: string | null;
    if (Platform.OS === 'web') {
      jsonData = localStorage.getItem(STORAGE_KEYS.AVATAR_DATA);
    } else {
      jsonData = await AsyncStorage.getItem(STORAGE_KEYS.AVATAR_DATA);
    }
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error('Error retrieving avatar data:', error);
    return null;
  }
};

/**
 * Get just the measurements
 */
export const getAvatarMeasurements = async (): Promise<AvatarMeasurements | null> => {
  const data = await getAvatarData();
  return data?.measurements || null;
};

/**
 * Check if avatar exists (has measurements or landmarks)
 */
export const hasAvatar = async (): Promise<boolean> => {
  const data = await getAvatarData();
  if (!data) return false;
  
  // Check if measurements are set
  if (data.measurements) {
    const m = data.measurements;
    if (m.shoulders > 0 || m.chest > 0 || m.waist > 0 || m.hips > 0 || m.inseam > 0) {
      return true;
    }
  }
  
  // Check if landmarks are set
  if (data.landmarks && data.bodyDimensions) {
    return true;
  }
  
  return false;
};

/**
 * Clear all avatar data from device
 */
export const clearAvatarData = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEYS.AVATAR_DATA);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.AVATAR_DATA);
    }
    console.log('Avatar data cleared');
  } catch (error) {
    console.error('Error clearing avatar data:', error);
    throw error;
  }
};
