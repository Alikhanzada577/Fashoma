/**
 * Hook for Pose Detection using MediaPipe
 * 
 * Provides a simple interface to detect body pose from images.
 * Uses WebView + MediaPipe under the hood.
 */

import { useRef, useState, useCallback } from 'react';
import { PoseDetectorRef, PoseDetectionResult } from '@/components/PoseDetection/PoseDetectorWebView';

export interface UsePoseDetectionResult {
  isReady: boolean;
  isDetecting: boolean;
  error: string | null;
  detectPose: (imageUri: string) => Promise<PoseDetectionResult>;
  poseDetectorRef: React.RefObject<PoseDetectorRef>;
  onReady: () => void;
  onError: (error: string) => void;
}

export const usePoseDetection = (): UsePoseDetectionResult => {
  const poseDetectorRef = useRef<PoseDetectorRef>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onReady = useCallback(() => {
    console.log('MediaPipe pose detector ready');
    setIsReady(true);
    setError(null);
  }, []);

  const onError = useCallback((errorMessage: string) => {
    console.error('MediaPipe pose detector error:', errorMessage);
    setError(errorMessage);
  }, []);

  const detectPose = useCallback(async (imageUri: string): Promise<PoseDetectionResult> => {
    if (!poseDetectorRef.current) {
      return {
        success: false,
        landmarks: null,
        bodyDimensions: null,
        confidence: 0,
        message: 'Pose detector not initialized',
      };
    }

    setIsDetecting(true);
    setError(null);

    try {
      const result = await poseDetectorRef.current.detectPose(imageUri);
      setIsDetecting(false);
      return result;
    } catch (err) {
      setIsDetecting(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        landmarks: null,
        bodyDimensions: null,
        confidence: 0,
        message: errorMessage,
      };
    }
  }, []);

  return {
    isReady,
    isDetecting,
    error,
    detectPose,
    poseDetectorRef,
    onReady,
    onError,
  };
};

export default usePoseDetection;
