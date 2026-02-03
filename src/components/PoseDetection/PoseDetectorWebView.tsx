/**
 * Pose Detector using WebView + MediaPipe
 * 
 * Uses MediaPipe's official pose detection running in a WebView.
 * Processes static images and returns body landmarks.
 * 
 * This is a frontend-only solution - no backend needed.
 */

import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { BodyLandmarks, Landmark, POSE_LANDMARKS, calculateBodyDimensions, BodyDimensions } from '@/services/pose.service';

/**
 * Convert file URI to base64 using fetch + blob (pure JS, no native modules)
 */
const uriToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert image: ${error}`);
  }
};

export interface PoseDetectionResult {
  success: boolean;
  landmarks: BodyLandmarks | null;
  bodyDimensions: BodyDimensions | null;
  confidence: number;
  message: string;
}

export interface PoseDetectorRef {
  detectPose: (imageUri: string) => Promise<PoseDetectionResult>;
}

interface PoseDetectorWebViewProps {
  onReady?: () => void;
  onError?: (error: string) => void;
}

/**
 * HTML content with MediaPipe pose detection
 */
const getMediaPipeHTML = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js" crossorigin="anonymous"></script>
  <style>
    body { margin: 0; padding: 0; background: #f0f0f0; }
    #canvas { display: none; }
    #status { font-family: sans-serif; padding: 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div id="status">Loading MediaPipe...</div>
  <canvas id="canvas"></canvas>
  <img id="image" style="display:none" crossorigin="anonymous">
  
  <script>
    let pose = null;
    let isReady = false;
    
    // Initialize MediaPipe Pose
    async function initPose() {
      try {
        pose = new Pose({
          locateFile: (file) => {
            return 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/' + file;
          }
        });
        
        pose.setOptions({
          modelComplexity: 0,           // Use lighter model for faster/more reliable detection
          smoothLandmarks: false,       // Not needed for static images
          enableSegmentation: false,
          minDetectionConfidence: 0.3,  // Lower threshold to detect more poses
          minTrackingConfidence: 0.3
        });
        
        pose.onResults(onResults);
        
        // Warm up the model
        const canvas = document.getElementById('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 100, 100);
        await pose.send({image: canvas});
        
        isReady = true;
        document.getElementById('status').innerText = 'Ready';
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      } catch (error) {
        document.getElementById('status').innerText = 'Error: ' + error.message;
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'error', 
          message: error.message 
        }));
      }
    }
    
    let currentResolve = null;
    
    function onResults(results) {
      if (!currentResolve) return;
      
      // Log detection results for debugging
      console.log('MediaPipe results:', results.poseLandmarks ? results.poseLandmarks.length + ' landmarks' : 'no landmarks');
      
      if (results.poseLandmarks && results.poseLandmarks.length >= 25) {
        // Accept if we have at least 25 landmarks (some may be hidden)
        const landmarks = results.poseLandmarks.map(l => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility || 0.5
        }));
        
        currentResolve({
          success: true,
          landmarks: landmarks,
          message: 'Pose detected successfully'
        });
      } else {
        currentResolve({
          success: false,
          landmarks: null,
          message: 'No pose detected in image'
        });
      }
      currentResolve = null;
    }
    
    // Process image from base64
    async function processImage(base64Data) {
      if (!isReady) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          success: false,
          message: 'Pose detector not ready'
        }));
        return;
      }
      
      return new Promise((resolve) => {
        currentResolve = (result) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'result',
            ...result
          }));
          resolve(result);
        };
        
        const img = document.getElementById('image');
        img.onload = async () => {
          try {
            const canvas = document.getElementById('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            console.log('Image loaded: ' + img.naturalWidth + 'x' + img.naturalHeight);
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            document.getElementById('status').innerText = 'Detecting pose...';
            await pose.send({image: canvas});
            document.getElementById('status').innerText = 'Done';
          } catch (error) {
            console.log('Processing error: ' + error.message);
            currentResolve({
              success: false,
              landmarks: null,
              message: 'Processing error: ' + error.message
            });
          }
        };
        
        img.onerror = () => {
          currentResolve({
            success: false,
            landmarks: null,
            message: 'Failed to load image'
          });
        };
        
        img.src = base64Data;
      });
    }
    
    // Handle messages from React Native
    window.processImageFromRN = function(base64) {
      processImage(base64);
    };
    
    // Initialize on load
    initPose();
  </script>
</body>
</html>
`;

/**
 * Extract body landmarks from raw MediaPipe landmarks array
 */
const extractBodyLandmarks = (rawLandmarks: Landmark[]): BodyLandmarks => {
  return {
    leftShoulder: rawLandmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    rightShoulder: rawLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
    leftHip: rawLandmarks[POSE_LANDMARKS.LEFT_HIP],
    rightHip: rawLandmarks[POSE_LANDMARKS.RIGHT_HIP],
    leftAnkle: rawLandmarks[POSE_LANDMARKS.LEFT_ANKLE],
    rightAnkle: rawLandmarks[POSE_LANDMARKS.RIGHT_ANKLE],
    nose: rawLandmarks[POSE_LANDMARKS.NOSE],
    leftElbow: rawLandmarks[POSE_LANDMARKS.LEFT_ELBOW],
    rightElbow: rawLandmarks[POSE_LANDMARKS.RIGHT_ELBOW],
    leftWrist: rawLandmarks[POSE_LANDMARKS.LEFT_WRIST],
    rightWrist: rawLandmarks[POSE_LANDMARKS.RIGHT_WRIST],
    leftKnee: rawLandmarks[POSE_LANDMARKS.LEFT_KNEE],
    rightKnee: rawLandmarks[POSE_LANDMARKS.RIGHT_KNEE],
    raw: rawLandmarks,
  };
};

export const PoseDetectorWebView = forwardRef<PoseDetectorRef, PoseDetectorWebViewProps>(
  ({ onReady, onError }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [isReady, setIsReady] = useState(false);
    const pendingResolveRef = useRef<((result: PoseDetectionResult) => void) | null>(null);

    useImperativeHandle(ref, () => ({
      detectPose: async (imageUri: string): Promise<PoseDetectionResult> => {
        if (!isReady) {
          return {
            success: false,
            landmarks: null,
            bodyDimensions: null,
            confidence: 0,
            message: 'Pose detector not ready',
          };
        }

        try {
          // Convert image to base64 data URL using pure JS (no native modules needed)
          console.log('Converting image to base64...');
          const dataUrl = await uriToBase64(imageUri);
          
          if (!dataUrl || !dataUrl.startsWith('data:')) {
            throw new Error('Failed to convert image to base64');
          }
          
          console.log('Base64 conversion successful, length:', dataUrl.length);

          return new Promise((resolve) => {
            pendingResolveRef.current = resolve;
            
            // Send to WebView
            webViewRef.current?.injectJavaScript(`
              processImageFromRN("${dataUrl}");
              true;
            `);

            // Timeout after 30 seconds
            setTimeout(() => {
              if (pendingResolveRef.current === resolve) {
                pendingResolveRef.current = null;
                resolve({
                  success: false,
                  landmarks: null,
                  bodyDimensions: null,
                  confidence: 0,
                  message: 'Detection timeout',
                });
              }
            }, 30000);
          });
        } catch (error) {
          return {
            success: false,
            landmarks: null,
            bodyDimensions: null,
            confidence: 0,
            message: `Error: ${error}`,
          };
        }
      },
    }));

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        
        if (data.type === 'ready') {
          setIsReady(true);
          onReady?.();
        } else if (data.type === 'error') {
          onError?.(data.message);
        } else if (data.type === 'result') {
          if (pendingResolveRef.current) {
            if (data.success && data.landmarks) {
              const bodyLandmarks = extractBodyLandmarks(data.landmarks);
              const bodyDimensions = calculateBodyDimensions(bodyLandmarks);
              
              pendingResolveRef.current({
                success: true,
                landmarks: bodyLandmarks,
                bodyDimensions,
                confidence: 0.9,
                message: data.message,
              });
            } else {
              pendingResolveRef.current({
                success: false,
                landmarks: null,
                bodyDimensions: null,
                confidence: 0,
                message: data.message,
              });
            }
            pendingResolveRef.current = null;
          }
        }
      } catch (error) {
        console.error('WebView message parse error:', error);
      }
    };

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: getMediaPipeHTML() }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          originWhitelist={['*']}
          style={styles.webview}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  webview: {
    width: 1,
    height: 1,
  },
});

export default PoseDetectorWebView;
