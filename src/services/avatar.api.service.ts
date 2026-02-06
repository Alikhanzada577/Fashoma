/**
 * Avatar API Service
 * Handles API calls to save/retrieve avatar metadata from backend
 */

import apiClient, { ApiResponse, parseApiError } from './api.service';

// ============================================
// Types
// ============================================

export interface AvatarMetadataInput {
  captureMethod: 'camera' | 'upload' | 'manual';
  deviceType: 'ios' | 'android' | 'web';
  qualityScore?: number;
  captureEnvironment?: 'indoor' | 'outdoor' | 'unknown';
  consentGiven: boolean;
  dataRetentionAgreed?: boolean;
}

export interface AvatarMetadataResponse {
  hasAvatar: boolean;
  avatarCreatedAt?: string;
  lastUpdatedAt?: string;
  captureMethod?: string;
  deviceType?: string;
  qualityScore?: number;
  captureEnvironment?: string;
  version?: number;
  message?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Create or update avatar metadata on backend
 * POST /api/v1/avatar/createUpdateMetadata
 */
export const saveAvatarMetadataToBackend = async (
  metadata: AvatarMetadataInput
): Promise<AvatarMetadataResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AvatarMetadataResponse>>(
      '/avatar/createUpdateMetadata',
      metadata
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to save avatar metadata');
  } catch (error) {
    console.error('Error saving avatar metadata to backend:', parseApiError(error));
    throw error;
  }
};

/**
 * Get avatar metadata from backend
 * GET /api/v1/avatar/getMetadata
 */
export const getAvatarMetadataFromBackend = async (): Promise<AvatarMetadataResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<AvatarMetadataResponse>>(
      '/avatar/getMetadata'
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get avatar metadata');
  } catch (error) {
    console.error('Error getting avatar metadata from backend:', parseApiError(error));
    throw error;
  }
};

/**
 * Delete avatar metadata from backend
 * DELETE /api/v1/avatar/deleteMetadata
 */
export const deleteAvatarMetadataFromBackend = async (): Promise<void> => {
  try {
    const response = await apiClient.delete<ApiResponse<null>>(
      '/avatar/deleteMetadata'
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete avatar metadata');
    }
  } catch (error) {
    console.error('Error deleting avatar metadata from backend:', parseApiError(error));
    throw error;
  }
};

/**
 * Check if user has avatar on backend
 */
export const hasAvatarOnBackend = async (): Promise<boolean> => {
  try {
    const metadata = await getAvatarMetadataFromBackend();
    return metadata.hasAvatar;
  } catch (error) {
    // If request fails, assume no avatar
    return false;
  }
};
