/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiClient, { ApiResponse, AuthResponse, parseApiError } from './api.service';
import { API_ENDPOINTS } from '@/config/api.config';
import { storeTokens, storeUserData, clearAuthData, getRefreshToken } from './storage.service';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );

    if (response.data.success && response.data.data) {
      const { user, tokens } = response.data.data;
      
      // Store tokens and user data
      await storeTokens(tokens.accessToken, tokens.refreshToken);
      await storeUserData(user);
      
      return response.data.data;
    }

    throw new Error(response.data.message || 'Registration failed');
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );

    if (response.data.success && response.data.data) {
      const { user, tokens } = response.data.data;
      
      // Store tokens and user data
      await storeTokens(tokens.accessToken, tokens.refreshToken);
      await storeUserData(user);
      
      return response.data.data;
    }

    throw new Error(response.data.message || 'Login failed');
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

/**
 * Request password reset OTP
 */
export const forgotPassword = async (data: ForgotPasswordData): Promise<string> => {
  try {
    const response = await apiClient.post<ApiResponse>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );

    if (response.data.success) {
      return response.data.message;
    }

    throw new Error(response.data.message || 'Failed to send OTP');
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (data: VerifyOTPData): Promise<string> => {
  try {
    const response = await apiClient.post<ApiResponse>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      data
    );

    if (response.data.success) {
      return response.data.message;
    }

    throw new Error(response.data.message || 'OTP verification failed');
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

/**
 * Reset password
 */
export const resetPassword = async (data: ResetPasswordData): Promise<string> => {
  try {
    const response = await apiClient.post<ApiResponse>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );

    if (response.data.success) {
      return response.data.message;
    }

    throw new Error(response.data.message || 'Password reset failed');
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

/**
 * Sign out user
 */
export const signOut = async (): Promise<void> => {
  try {
    const refreshToken = await getRefreshToken();
    
    if (refreshToken) {
      await apiClient.post(API_ENDPOINTS.AUTH.SIGNOUT, { refreshToken });
    }
    
    // Clear local storage regardless of API response
    await clearAuthData();
  } catch (error) {
    // Even if API call fails, clear local data
    await clearAuthData();
    throw new Error(parseApiError(error));
  }
};

/**
 * Check if user is authenticated
 */
export const checkAuth = async (): Promise<boolean> => {
  try {
    const token = await getRefreshToken();
    return !!token;
  } catch (error) {
    return false;
  }
};
