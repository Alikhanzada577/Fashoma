/**
 * Outline Calculation Service
 * 
 * Calculates SVG path points for body silhouette from landmarks.
 * Handles scaling of body regions when measurements are adjusted.
 */

import { BodyLandmarks, BodyDimensions } from './pose.service';
import { AvatarMeasurements } from './avatar.storage.service';

/**
 * Point in normalized coordinates (0-1)
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Outline points for drawing the body silhouette
 */
export interface BodyOutlinePoints {
  // Neck/shoulder line (top of silhouette - below face)
  neckCenter: Point;
  leftShoulderOuter: Point;
  rightShoulderOuter: Point;
  
  // Arms (for T-pose)
  leftElbowOuter: Point;
  rightElbowOuter: Point;
  leftWristOuter: Point;
  rightWristOuter: Point;
  
  // Torso points
  leftChest: Point;
  rightChest: Point;
  leftWaist: Point;
  rightWaist: Point;
  
  // Hip points
  leftHipOuter: Point;
  rightHipOuter: Point;
  
  // Leg points
  leftKneeOuter: Point;
  rightKneeOuter: Point;
  leftKneeInner: Point;
  rightKneeInner: Point;
  leftAnkleOuter: Point;
  rightAnkleOuter: Point;
  leftAnkleInner: Point;
  rightAnkleInner: Point;
}

/**
 * Base measurements used for calculating scale factors
 * These are "reference" measurements that correspond to the detected landmarks
 */
export interface BaseMeasurements {
  shoulders: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
}

/**
 * Calculate scale factor for a measurement
 * Returns how much to scale the outline (1.0 = no change)
 */
export const getScaleFactor = (
  currentValue: number,
  baseValue: number
): number => {
  if (baseValue <= 0) return 1.0;
  return currentValue / baseValue;
};

/**
 * Offset a point horizontally based on scale factor
 * Moves the point further from or closer to the center
 */
const offsetPointHorizontally = (
  point: Point,
  centerX: number,
  scaleFactor: number
): Point => {
  const distanceFromCenter = point.x - centerX;
  const newDistance = distanceFromCenter * scaleFactor;
  return {
    x: centerX + newDistance,
    y: point.y,
  };
};

/**
 * Calculate body outline points from landmarks
 * These are the raw points based on detected pose
 */
export const calculateBaseOutlinePoints = (
  landmarks: BodyLandmarks,
  imageWidth: number,
  imageHeight: number
): BodyOutlinePoints => {
  // Body thickness offsets (how far outside the landmark points the outline goes)
  const shoulderOffset = 0.03; // Slight padding outside shoulders
  const armThickness = 0.015; // Arm width
  const torsoOffset = 0.02; // Torso padding
  const legThickness = 0.025; // Leg width
  
  const centerX = (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2;
  
  // Neck center - slightly above and between shoulders
  const neckCenter: Point = {
    x: centerX,
    y: landmarks.leftShoulder.y - 0.02, // Just above shoulders
  };
  
  // Shoulder outer points
  const leftShoulderOuter: Point = {
    x: landmarks.leftShoulder.x - shoulderOffset,
    y: landmarks.leftShoulder.y,
  };
  const rightShoulderOuter: Point = {
    x: landmarks.rightShoulder.x + shoulderOffset,
    y: landmarks.rightShoulder.y,
  };
  
  // Elbow outer points (for T-pose arms)
  const leftElbowOuter: Point = {
    x: landmarks.leftElbow.x - armThickness,
    y: landmarks.leftElbow.y - armThickness,
  };
  const rightElbowOuter: Point = {
    x: landmarks.rightElbow.x + armThickness,
    y: landmarks.rightElbow.y - armThickness,
  };
  
  // Wrist outer points
  const leftWristOuter: Point = {
    x: landmarks.leftWrist.x - armThickness,
    y: landmarks.leftWrist.y,
  };
  const rightWristOuter: Point = {
    x: landmarks.rightWrist.x + armThickness,
    y: landmarks.rightWrist.y,
  };
  
  // Chest points (interpolated between shoulder and hip)
  const chestY = landmarks.leftShoulder.y + 
    (landmarks.leftHip.y - landmarks.leftShoulder.y) * 0.35;
  const leftChest: Point = {
    x: landmarks.leftShoulder.x - torsoOffset * 0.5,
    y: chestY,
  };
  const rightChest: Point = {
    x: landmarks.rightShoulder.x + torsoOffset * 0.5,
    y: chestY,
  };
  
  // Waist points (narrower than chest and hips)
  const waistY = landmarks.leftShoulder.y + 
    (landmarks.leftHip.y - landmarks.leftShoulder.y) * 0.65;
  const waistInset = 0.02; // Waist is typically narrower
  const leftWaist: Point = {
    x: landmarks.leftHip.x + waistInset,
    y: waistY,
  };
  const rightWaist: Point = {
    x: landmarks.rightHip.x - waistInset,
    y: waistY,
  };
  
  // Hip outer points
  const leftHipOuter: Point = {
    x: landmarks.leftHip.x - torsoOffset,
    y: landmarks.leftHip.y,
  };
  const rightHipOuter: Point = {
    x: landmarks.rightHip.x + torsoOffset,
    y: landmarks.rightHip.y,
  };
  
  // Knee points
  const leftKneeOuter: Point = {
    x: landmarks.leftKnee.x - legThickness,
    y: landmarks.leftKnee.y,
  };
  const rightKneeOuter: Point = {
    x: landmarks.rightKnee.x + legThickness,
    y: landmarks.rightKnee.y,
  };
  const leftKneeInner: Point = {
    x: landmarks.leftKnee.x + legThickness * 0.5,
    y: landmarks.leftKnee.y,
  };
  const rightKneeInner: Point = {
    x: landmarks.rightKnee.x - legThickness * 0.5,
    y: landmarks.rightKnee.y,
  };
  
  // Ankle points
  const leftAnkleOuter: Point = {
    x: landmarks.leftAnkle.x - legThickness * 0.8,
    y: landmarks.leftAnkle.y,
  };
  const rightAnkleOuter: Point = {
    x: landmarks.rightAnkle.x + legThickness * 0.8,
    y: landmarks.rightAnkle.y,
  };
  const leftAnkleInner: Point = {
    x: landmarks.leftAnkle.x + legThickness * 0.5,
    y: landmarks.leftAnkle.y,
  };
  const rightAnkleInner: Point = {
    x: landmarks.rightAnkle.x - legThickness * 0.5,
    y: landmarks.rightAnkle.y,
  };
  
  return {
    neckCenter,
    leftShoulderOuter,
    rightShoulderOuter,
    leftElbowOuter,
    rightElbowOuter,
    leftWristOuter,
    rightWristOuter,
    leftChest,
    rightChest,
    leftWaist,
    rightWaist,
    leftHipOuter,
    rightHipOuter,
    leftKneeOuter,
    rightKneeOuter,
    leftKneeInner,
    rightKneeInner,
    leftAnkleOuter,
    rightAnkleOuter,
    leftAnkleInner,
    rightAnkleInner,
  };
};

/**
 * Apply measurement adjustments to outline points
 * When user increases/decreases a measurement, the corresponding region scales
 */
export const applyMeasurementScaling = (
  basePoints: BodyOutlinePoints,
  baseMeasurements: BaseMeasurements,
  currentMeasurements: AvatarMeasurements
): BodyOutlinePoints => {
  const centerX = (basePoints.leftShoulderOuter.x + basePoints.rightShoulderOuter.x) / 2;
  
  // Calculate scale factors for each measurement
  const shoulderScale = getScaleFactor(currentMeasurements.shoulders, baseMeasurements.shoulders);
  const chestScale = getScaleFactor(currentMeasurements.chest, baseMeasurements.chest);
  const waistScale = getScaleFactor(currentMeasurements.waist, baseMeasurements.waist);
  const hipScale = getScaleFactor(currentMeasurements.hips, baseMeasurements.hips);
  
  // Apply scaling to each body region
  return {
    ...basePoints,
    
    // Shoulder scaling
    leftShoulderOuter: offsetPointHorizontally(basePoints.leftShoulderOuter, centerX, shoulderScale),
    rightShoulderOuter: offsetPointHorizontally(basePoints.rightShoulderOuter, centerX, shoulderScale),
    
    // Chest scaling
    leftChest: offsetPointHorizontally(basePoints.leftChest, centerX, chestScale),
    rightChest: offsetPointHorizontally(basePoints.rightChest, centerX, chestScale),
    
    // Waist scaling
    leftWaist: offsetPointHorizontally(basePoints.leftWaist, centerX, waistScale),
    rightWaist: offsetPointHorizontally(basePoints.rightWaist, centerX, waistScale),
    
    // Hip scaling
    leftHipOuter: offsetPointHorizontally(basePoints.leftHipOuter, centerX, hipScale),
    rightHipOuter: offsetPointHorizontally(basePoints.rightHipOuter, centerX, hipScale),
    
    // Leg points also scale slightly with hips
    leftKneeOuter: offsetPointHorizontally(basePoints.leftKneeOuter, centerX, hipScale * 0.8),
    rightKneeOuter: offsetPointHorizontally(basePoints.rightKneeOuter, centerX, hipScale * 0.8),
    leftKneeInner: offsetPointHorizontally(basePoints.leftKneeInner, centerX, hipScale * 0.5),
    rightKneeInner: offsetPointHorizontally(basePoints.rightKneeInner, centerX, hipScale * 0.5),
  };
};

/**
 * Convert normalized point to pixel coordinates
 */
export const toPixelCoords = (
  point: Point,
  width: number,
  height: number
): { x: number; y: number } => ({
  x: point.x * width,
  y: point.y * height,
});

/**
 * Generate SVG path string for the body silhouette
 * Creates a smooth path that:
 * - Starts at neck (below face)
 * - Goes around the body including arms (for T-pose)
 * - Does NOT include the head/face
 */
export const generateBodySVGPath = (
  points: BodyOutlinePoints,
  width: number,
  height: number,
  includeArms: boolean = true
): string => {
  const p = (point: Point) => {
    const px = toPixelCoords(point, width, height);
    return `${px.x.toFixed(1)},${px.y.toFixed(1)}`;
  };
  
  // Bezier curve control point helper
  const bezier = (p1: Point, p2: Point, tension: number = 0.3) => {
    const px1 = toPixelCoords(p1, width, height);
    const px2 = toPixelCoords(p2, width, height);
    const cx = px1.x + (px2.x - px1.x) * tension;
    const cy = px1.y + (px2.y - px1.y) * tension;
    return `${cx.toFixed(1)},${cy.toFixed(1)}`;
  };
  
  let path = '';
  
  // Start at neck center
  path += `M ${p(points.neckCenter)} `;
  
  if (includeArms) {
    // Left side with arm
    path += `L ${p(points.leftShoulderOuter)} `;
    path += `L ${p(points.leftElbowOuter)} `;
    path += `L ${p(points.leftWristOuter)} `;
    // Back up the arm (inner side)
    path += `L ${p({ x: points.leftWristOuter.x + 0.03, y: points.leftWristOuter.y })} `;
    path += `L ${p({ x: points.leftElbowOuter.x + 0.03, y: points.leftElbowOuter.y + 0.02 })} `;
    path += `L ${p({ x: points.leftShoulderOuter.x + 0.02, y: points.leftShoulderOuter.y + 0.02 })} `;
  } else {
    // Just go to shoulder
    path += `L ${p(points.leftShoulderOuter)} `;
  }
  
  // Down left side of torso with curves
  path += `Q ${bezier(points.leftShoulderOuter, points.leftChest)} ${p(points.leftChest)} `;
  path += `Q ${bezier(points.leftChest, points.leftWaist)} ${p(points.leftWaist)} `;
  path += `Q ${bezier(points.leftWaist, points.leftHipOuter)} ${p(points.leftHipOuter)} `;
  
  // Down left leg
  path += `L ${p(points.leftKneeOuter)} `;
  path += `L ${p(points.leftAnkleOuter)} `;
  
  // Across left foot
  path += `L ${p(points.leftAnkleInner)} `;
  
  // Up inner left leg to crotch
  path += `L ${p(points.leftKneeInner)} `;
  
  // Across crotch area
  const crotchY = points.leftHipOuter.y + 0.05;
  const crotchCenter = {
    x: (points.leftHipOuter.x + points.rightHipOuter.x) / 2,
    y: crotchY,
  };
  path += `L ${p({ x: points.leftKneeInner.x, y: crotchY })} `;
  path += `Q ${p(crotchCenter)} ${p({ x: points.rightKneeInner.x, y: crotchY })} `;
  
  // Down inner right leg
  path += `L ${p(points.rightKneeInner)} `;
  path += `L ${p(points.rightAnkleInner)} `;
  
  // Across right foot
  path += `L ${p(points.rightAnkleOuter)} `;
  
  // Up right leg
  path += `L ${p(points.rightKneeOuter)} `;
  path += `L ${p(points.rightHipOuter)} `;
  
  // Up right side of torso with curves
  path += `Q ${bezier(points.rightHipOuter, points.rightWaist)} ${p(points.rightWaist)} `;
  path += `Q ${bezier(points.rightWaist, points.rightChest)} ${p(points.rightChest)} `;
  path += `Q ${bezier(points.rightChest, points.rightShoulderOuter)} ${p(points.rightShoulderOuter)} `;
  
  if (includeArms) {
    // Right arm
    path += `L ${p({ x: points.rightShoulderOuter.x - 0.02, y: points.rightShoulderOuter.y + 0.02 })} `;
    path += `L ${p({ x: points.rightElbowOuter.x - 0.03, y: points.rightElbowOuter.y + 0.02 })} `;
    path += `L ${p({ x: points.rightWristOuter.x - 0.03, y: points.rightWristOuter.y })} `;
    // Back down arm (outer side)
    path += `L ${p(points.rightWristOuter)} `;
    path += `L ${p(points.rightElbowOuter)} `;
    path += `L ${p(points.rightShoulderOuter)} `;
  }
  
  // Back to neck
  path += `L ${p(points.neckCenter)} `;
  
  // Close path
  path += 'Z';
  
  return path;
};

/**
 * Generate a simpler body path without arms (for non-T-pose or cleaner look)
 */
export const generateSimpleBodySVGPath = (
  points: BodyOutlinePoints,
  width: number,
  height: number
): string => {
  return generateBodySVGPath(points, width, height, false);
};
