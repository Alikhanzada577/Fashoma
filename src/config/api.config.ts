/**
 * API Configuration
 * All clients use the same backend URL. No hardcoded IPs.
 * Optional: set EXPO_PUBLIC_API_URL in .env to override (e.g. your machine IP for local dev).
 */

const PRODUCTION_API_URL = 'https://fashoma-backend.vercel.app/api/v1';

export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL?.trim()) ||
  PRODUCTION_API_URL;

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
