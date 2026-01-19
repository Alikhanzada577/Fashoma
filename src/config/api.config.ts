/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// Development API URL - Update this to match your backend
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1'
  : 'https://api.fashoma.com/api/v1';

export const API_TIMEOUT = 30000; // 30 seconds

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    GOOGLE_AUTH: '/auth/google',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_OTP: '/auth/verify-otp',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    SIGNOUT: '/auth/signout',
  },
  
  // Health check
  HEALTH: '/health',
} as const;
