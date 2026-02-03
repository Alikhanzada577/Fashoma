/**
 * Pose Detection Service
 * 
 * Uses MediaPipe to detect body landmarks from a T-pose photo.
 * Extracts key body points for accurate garment positioning.
 * 
 * All processing happens on device - no data is sent to any server.
 */

/**
 * MediaPipe Pose Landmark indices
 * Full list: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
export const POSE_LANDMARKS = {
  // Face
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  
  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  
  // Lower body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * A single landmark point with normalized coordinates (0-1)
 */
export interface Landmark {
  x: number; // 0-1, left to right
  y: number; // 0-1, top to bottom
  z: number; // depth (relative to hips)
  visibility: number; // 0-1, confidence
}

/**
 * Key body landmarks extracted for garment positioning
 */
export interface BodyLandmarks {
  // Shoulders (for T-shirt width and position)
  leftShoulder: Landmark;
  rightShoulder: Landmark;
  
  // Hips (for pants top, T-shirt bottom)
  leftHip: Landmark;
  rightHip: Landmark;
  
  // Ankles (for pants length)
  leftAnkle: Landmark;
  rightAnkle: Landmark;
  
  // Additional useful points
  nose: Landmark; // For head position reference
  leftElbow: Landmark;
  rightElbow: Landmark;
  leftWrist: Landmark;
  rightWrist: Landmark;
  leftKnee: Landmark;
  rightKnee: Landmark;
  
  // Raw landmarks array (all 33)
  raw: Landmark[];
}

/**
 * Calculated body dimensions from landmarks (normalized 0-1)
 */
export interface BodyDimensions {
  // Horizontal measurements
  shoulderWidth: number;  // Distance between shoulders
  hipWidth: number;       // Distance between hips
  
  // Vertical measurements  
  torsoHeight: number;    // Shoulder to hip
  legLength: number;      // Hip to ankle
  
  // Center points (for garment positioning)
  shoulderCenter: { x: number; y: number };
  hipCenter: { x: number; y: number };
  torsoCenter: { x: number; y: number };
}

/**
 * Extract key body landmarks from MediaPipe raw landmarks array
 */
export const extractBodyLandmarks = (rawLandmarks: Landmark[]): BodyLandmarks | null => {
  if (!rawLandmarks || rawLandmarks.length < 33) {
    console.warn('Invalid landmarks array - expected 33 landmarks');
    return null;
  }
  
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

/**
 * Calculate body dimensions from landmarks
 */
export const calculateBodyDimensions = (landmarks: BodyLandmarks): BodyDimensions => {
  const { leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle } = landmarks;
  
  // Calculate distances
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const hipWidth = Math.abs(rightHip.x - leftHip.x);
  
  // Vertical measurements (average of left and right)
  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const avgHipY = (leftHip.y + rightHip.y) / 2;
  const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
  
  const torsoHeight = avgHipY - avgShoulderY;
  const legLength = avgAnkleY - avgHipY;
  
  // Center points
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: avgShoulderY,
  };
  
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: avgHipY,
  };
  
  const torsoCenter = {
    x: (shoulderCenter.x + hipCenter.x) / 2,
    y: (shoulderCenter.y + hipCenter.y) / 2,
  };
  
  return {
    shoulderWidth,
    hipWidth,
    torsoHeight,
    legLength,
    shoulderCenter,
    hipCenter,
    torsoCenter,
  };
};

/**
 * Validate that landmarks represent a valid T-pose
 * Returns true if the pose looks like a T-pose (arms extended)
 */
export const validateTPose = (landmarks: BodyLandmarks): { valid: boolean; message: string } => {
  const { leftShoulder, rightShoulder, leftWrist, rightWrist, leftElbow, rightElbow } = landmarks;
  
  // Check if arms are roughly horizontal (wrists should be at similar Y to shoulders)
  const leftArmHorizontal = Math.abs(leftWrist.y - leftShoulder.y) < 0.15;
  const rightArmHorizontal = Math.abs(rightWrist.y - rightShoulder.y) < 0.15;
  
  // Check if arms are extended outward (wrists should be outside shoulders)
  const leftArmExtended = leftWrist.x < leftShoulder.x;
  const rightArmExtended = rightWrist.x > rightShoulder.x;
  
  // Check visibility of key landmarks
  const keyLandmarksVisible = 
    leftShoulder.visibility > 0.5 &&
    rightShoulder.visibility > 0.5 &&
    landmarks.leftHip.visibility > 0.5 &&
    landmarks.rightHip.visibility > 0.5;
  
  if (!keyLandmarksVisible) {
    return { valid: false, message: 'Body not fully visible. Please step back or adjust camera.' };
  }
  
  if (!leftArmHorizontal || !rightArmHorizontal) {
    return { valid: false, message: 'Please extend your arms horizontally to form a T-shape.' };
  }
  
  if (!leftArmExtended || !rightArmExtended) {
    return { valid: false, message: 'Please extend your arms outward to the sides.' };
  }
  
  return { valid: true, message: 'Good T-pose detected!' };
};

/**
 * Create mock landmarks for testing (when MediaPipe is not available)
 * Simulates a centered T-pose
 */
export const createMockLandmarks = (): BodyLandmarks => {
  const createLandmark = (x: number, y: number, z: number = 0): Landmark => ({
    x, y, z, visibility: 1.0
  });
  
  // Create a centered T-pose
  const raw: Landmark[] = new Array(33).fill(null).map(() => createLandmark(0.5, 0.5));
  
  // Set key landmarks for T-pose
  raw[POSE_LANDMARKS.NOSE] = createLandmark(0.5, 0.08);
  raw[POSE_LANDMARKS.LEFT_SHOULDER] = createLandmark(0.35, 0.18);
  raw[POSE_LANDMARKS.RIGHT_SHOULDER] = createLandmark(0.65, 0.18);
  raw[POSE_LANDMARKS.LEFT_ELBOW] = createLandmark(0.20, 0.18);
  raw[POSE_LANDMARKS.RIGHT_ELBOW] = createLandmark(0.80, 0.18);
  raw[POSE_LANDMARKS.LEFT_WRIST] = createLandmark(0.08, 0.18);
  raw[POSE_LANDMARKS.RIGHT_WRIST] = createLandmark(0.92, 0.18);
  raw[POSE_LANDMARKS.LEFT_HIP] = createLandmark(0.42, 0.52);
  raw[POSE_LANDMARKS.RIGHT_HIP] = createLandmark(0.58, 0.52);
  raw[POSE_LANDMARKS.LEFT_KNEE] = createLandmark(0.42, 0.72);
  raw[POSE_LANDMARKS.RIGHT_KNEE] = createLandmark(0.58, 0.72);
  raw[POSE_LANDMARKS.LEFT_ANKLE] = createLandmark(0.42, 0.92);
  raw[POSE_LANDMARKS.RIGHT_ANKLE] = createLandmark(0.58, 0.92);
  
  return extractBodyLandmarks(raw)!;
};
