/**
 * Secure Storage Service
 * Handles secure storage of sensitive data like tokens
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

/**
 * Store access token securely
 */
export const storeAccessToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // For web, use localStorage as fallback
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    }
  } catch (error) {
    console.error('Error storing access token:', error);
    throw error;
  }
};

/**
 * Get access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Error retrieving access token:', error);
    return null;
  }
};

/**
 * Store refresh token securely
 */
export const storeRefreshToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    }
  } catch (error) {
    console.error('Error storing refresh token:', error);
    throw error;
  }
};

/**
 * Get refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    return null;
  }
};

/**
 * Store user data
 */
export const storeUserData = async (userData: any): Promise<void> => {
  try {
    const jsonData = JSON.stringify(userData);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, jsonData);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, jsonData);
    }
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

/**
 * Get user data
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    let jsonData: string | null;
    if (Platform.OS === 'web') {
      jsonData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    } else {
      jsonData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    }
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

/**
 * Clear all stored authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    }
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

/**
 * Store both tokens at once
 */
export const storeTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await Promise.all([
    storeAccessToken(accessToken),
    storeRefreshToken(refreshToken),
  ]);
};
