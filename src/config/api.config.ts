/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

import { Platform } from 'react-native';

// Get the correct localhost URL based on platform
const getLocalHostUrl = () => {
  if (Platform.OS === 'android') {
   
    return 'http://192.168.100.15:5000/api/v1';
  }
  // For iOS and web
  return 'http://localhost:5000/api/v1';
};

// Development API URL - Update this to match your backend
export const API_BASE_URL = __DEV__ 
  ? getLocalHostUrl()
  : 'https://fashoma-backend.vercel.app/api/v1';

export const API_TIMEOUT = 30000; // 30 seconds

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    GOOGLE_AUTH: '/auth/google/mobile',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_OTP: '/auth/verify-otp',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    SIGNOUT: '/auth/signout',
  },
  
  // Health check
  HEALTH: '/health',
} as const;
