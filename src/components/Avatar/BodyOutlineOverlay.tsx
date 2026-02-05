/**
 * Body Outline Overlay Component
 * 
 * Renders a filled body silhouette overlay on top of the user's photo.
 * The silhouette starts from the neck/shoulders down - face is NOT covered.
 * Updates dynamically when measurements are adjusted.
 * 
 * Works with ANY standing pose - not just T-pose.
 * Uses actual detected landmark positions from MediaPipe.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BodyLandmarks } from '@/services/pose.service';
import { AvatarMeasurements } from '@/services/avatar.storage.service';
import { BaseMeasurements, getScaleFactor } from '@/services/outlineCalculation.service';

interface BodyOutlineOverlayProps {
  /** Detected body landmarks from MediaPipe */
  landmarks: BodyLandmarks;
  /** Base measurements calculated from landmarks (used as reference for scaling) */
  baseMeasurements: BaseMeasurements;
  /** Current measurements (may be adjusted by user) */
  currentMeasurements: AvatarMeasurements;
  /** Width of the container */
  width: number;
  /** Height of the container */
  height: number;
  /** Original image aspect ratio (width/height) */
  imageAspectRatio?: number;
  /** Fill color for the silhouette */
  fillColor?: string;
  /** Fill opacity (0-1) */
  fillOpacity?: number;
  /** Whether to show arms in the outline */
  showArms?: boolean;
  /** Optional stroke color for outline border */
  strokeColor?: string;
  /** Optional stroke width */
  strokeWidth?: number;
}

/**
 * Calculate the actual displayed image bounds within a container
 * when using resizeMode="contain"
 */
const calculateContainedImageBounds = (
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number = 0.75
) => {
  const containerAspectRatio = containerWidth / containerHeight;
  
  let displayedWidth: number;
  let displayedHeight: number;
  let offsetX: number;
  let offsetY: number;
  
  if (imageAspectRatio > containerAspectRatio) {
    displayedWidth = containerWidth;
    displayedHeight = containerWidth / imageAspectRatio;
    offsetX = 0;
    offsetY = (containerHeight - displayedHeight) / 2;
  } else {
    displayedHeight = containerHeight;
    displayedWidth = containerHeight * imageAspectRatio;
    offsetX = (containerWidth - displayedWidth) / 2;
    offsetY = 0;
  }
  
  return { displayedWidth, displayedHeight, offsetX, offsetY };
};

/**
 * Check if pose appears to be a T-pose (arms extended horizontally)
 */
const isTPose = (landmarks: BodyLandmarks): boolean => {
  const { leftShoulder, rightShoulder, leftWrist, rightWrist, leftElbow, rightElbow } = landmarks;
  
  // Check if wrists are roughly at same Y level as shoulders (within 15%)
  const leftArmHorizontal = Math.abs(leftWrist.y - leftShoulder.y) < 0.15;
  const rightArmHorizontal = Math.abs(rightWrist.y - rightShoulder.y) < 0.15;
  
  // Check if wrists are extended outward (outside shoulders)
  const leftArmExtended = leftWrist.x < leftShoulder.x - 0.05;
  const rightArmExtended = rightWrist.x > rightShoulder.x + 0.05;
  
  return leftArmHorizontal && rightArmHorizontal && leftArmExtended && rightArmExtended;
};

/**
 * Check if arms are down by sides
 */
const areArmsDown = (landmarks: BodyLandmarks): boolean => {
  const { leftShoulder, rightShoulder, leftWrist, rightWrist } = landmarks;
  
  // Wrists should be below shoulders
  const leftArmDown = leftWrist.y > leftShoulder.y + 0.1;
  const rightArmDown = rightWrist.y > rightShoulder.y + 0.1;
  
  return leftArmDown && rightArmDown;
};

/**
 * Calculate body outline positions from actual landmarks
 */
const calculateBodyPositions = (
  landmarks: BodyLandmarks,
  baseMeasurements: BaseMeasurements,
  currentMeasurements: AvatarMeasurements,
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number = 0.75
) => {
  const { displayedWidth, displayedHeight, offsetX, offsetY } = 
    calculateContainedImageBounds(containerWidth, containerHeight, imageAspectRatio);
  
  // Measurement scale factors
  const shoulderScale = getScaleFactor(currentMeasurements.shoulders, baseMeasurements.shoulders);
  const chestScale = getScaleFactor(currentMeasurements.chest, baseMeasurements.chest);
  const waistScale = getScaleFactor(currentMeasurements.waist, baseMeasurements.waist);
  const hipScale = getScaleFactor(currentMeasurements.hips, baseMeasurements.hips);

  // Convert normalized (0-1) to pixel coordinates
  const toX = (n: number) => offsetX + (n * displayedWidth);
  const toY = (n: number) => offsetY + (n * displayedHeight);

  // Get all landmark positions in pixels
  const points = {
    leftShoulder: { x: toX(landmarks.leftShoulder.x), y: toY(landmarks.leftShoulder.y) },
    rightShoulder: { x: toX(landmarks.rightShoulder.x), y: toY(landmarks.rightShoulder.y) },
    leftHip: { x: toX(landmarks.leftHip.x), y: toY(landmarks.leftHip.y) },
    rightHip: { x: toX(landmarks.rightHip.x), y: toY(landmarks.rightHip.y) },
    leftKnee: { x: toX(landmarks.leftKnee.x), y: toY(landmarks.leftKnee.y) },
    rightKnee: { x: toX(landmarks.rightKnee.x), y: toY(landmarks.rightKnee.y) },
    leftAnkle: { x: toX(landmarks.leftAnkle.x), y: toY(landmarks.leftAnkle.y) },
    rightAnkle: { x: toX(landmarks.rightAnkle.x), y: toY(landmarks.rightAnkle.y) },
    leftElbow: { x: toX(landmarks.leftElbow.x), y: toY(landmarks.leftElbow.y) },
    rightElbow: { x: toX(landmarks.rightElbow.x), y: toY(landmarks.rightElbow.y) },
    leftWrist: { x: toX(landmarks.leftWrist.x), y: toY(landmarks.leftWrist.y) },
    rightWrist: { x: toX(landmarks.rightWrist.x), y: toY(landmarks.rightWrist.y) },
    nose: { x: toX(landmarks.nose.x), y: toY(landmarks.nose.y) },
  };

  // Calculate body center
  const bodyCenterX = (points.leftShoulder.x + points.rightShoulder.x) / 2;
  
  // Calculate actual widths from landmarks
  const actualShoulderWidth = Math.abs(points.rightShoulder.x - points.leftShoulder.x);
  const actualHipWidth = Math.abs(points.rightHip.x - points.leftHip.x);
  
  // Apply measurement scaling
  const shoulderWidth = actualShoulderWidth * shoulderScale;
  const hipWidth = actualHipWidth * hipScale;
  
  // Torso widths (interpolated)
  const chestWidth = shoulderWidth * 0.95 * chestScale;
  const waistWidth = ((shoulderWidth + hipWidth) / 2) * 0.85 * waistScale;
  
  // Vertical positions
  const shoulderY = (points.leftShoulder.y + points.rightShoulder.y) / 2;
  const hipY = (points.leftHip.y + points.rightHip.y) / 2;
  const kneeY = (points.leftKnee.y + points.rightKnee.y) / 2;
  const ankleY = (points.leftAnkle.y + points.rightAnkle.y) / 2;
  
  // Interpolated Y positions
  const chestY = shoulderY + (hipY - shoulderY) * 0.3;
  const waistY = shoulderY + (hipY - shoulderY) * 0.65;
  
  // Body part thicknesses (proportional to body size)
  const bodyScale = displayedHeight / 400; // Base scale
  const armThickness = Math.max(15, actualShoulderWidth * 0.15) * bodyScale;
  const legWidth = Math.max(20, actualHipWidth * 0.4) * bodyScale;
  
  // Check pose type
  const tPose = isTPose(landmarks);
  const armsDown = areArmsDown(landmarks);

  return {
    bodyCenterX,
    shoulderY,
    shoulderWidth,
    chestY,
    chestWidth,
    waistY,
    waistWidth,
    hipY,
    hipWidth,
    kneeY,
    ankleY,
    legWidth,
    armThickness,
    points,
    tPose,
    armsDown,
    displayedWidth,
    displayedHeight,
  };
};

/**
 * Body Outline Overlay Component
 * 
 * Draws body silhouette based on actual detected landmarks.
 * Adapts to different poses (T-pose, arms down, etc.)
 */
const BodyOutlineOverlay: React.FC<BodyOutlineOverlayProps> = ({
  landmarks,
  baseMeasurements,
  currentMeasurements,
  width,
  height,
  imageAspectRatio = 0.75,
  fillColor = 'rgba(80, 120, 100, 0.65)',
  fillOpacity = 0.65,
  showArms = true,
  strokeColor = '#FFFFFF',
  strokeWidth = 2.5,
}) => {
  const positions = useMemo(() => {
    try {
      return calculateBodyPositions(
        landmarks,
        baseMeasurements,
        currentMeasurements,
        width,
        height,
        imageAspectRatio
      );
    } catch (error) {
      console.error('Error calculating body positions:', error);
      return null;
    }
  }, [landmarks, baseMeasurements, currentMeasurements, width, height, imageAspectRatio]);

  if (!positions) return null;

  const {
    shoulderWidth,
    chestWidth,
    waistWidth,
    hipWidth,
    hipY,
    ankleY,
    legWidth,
    armThickness,
    points,
    tPose,
    armsDown,
  } = positions;

  const bodyPartStyle = {
    backgroundColor: fillColor,
    borderColor: strokeColor,
    borderWidth: strokeWidth,
    opacity: fillOpacity,
  };

  // Use ACTUAL landmark positions for all body parts
  // Shoulder section - use actual shoulder landmarks
  const shoulderLeft = Math.min(points.leftShoulder.x, points.rightShoulder.x);
  const shoulderTop = Math.min(points.leftShoulder.y, points.rightShoulder.y);
  const actualShoulderWidth = Math.abs(points.rightShoulder.x - points.leftShoulder.x);
  const shoulderCenterX = (points.leftShoulder.x + points.rightShoulder.x) / 2;
  
  // Hip section - use actual hip landmarks
  const hipLeft = Math.min(points.leftHip.x, points.rightHip.x);
  const hipTop = Math.min(points.leftHip.y, points.rightHip.y);
  const actualHipWidth = Math.abs(points.rightHip.x - points.leftHip.x);
  const hipCenterX = (points.leftHip.x + points.rightHip.x) / 2;
  
  // Chest position - interpolate between shoulders and hips (30% down)
  const chestY = shoulderTop + (hipTop - shoulderTop) * 0.3;
  const chestCenterX = shoulderCenterX + (hipCenterX - shoulderCenterX) * 0.3;
  
  // Waist position - interpolate between shoulders and hips (65% down)
  const waistY = shoulderTop + (hipTop - shoulderTop) * 0.65;
  const waistCenterX = shoulderCenterX + (hipCenterX - shoulderCenterX) * 0.65;
  
  // Neck position - centered above shoulders
  const neckCenterX = shoulderCenterX;
  const neckWidth = actualShoulderWidth * 0.25;

  // Calculate leg positions based on actual hip positions
  const leftLegX = points.leftHip.x - legWidth / 2;
  const rightLegX = points.rightHip.x - legWidth / 2;
  const legHeight = Math.max(ankleY - hipY - 10, 30);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* Neck connector - centered on shoulders */}
      <View
        style={[
          styles.bodyPart,
          bodyPartStyle,
          {
            left: neckCenterX - neckWidth / 2,
            top: shoulderTop - 15,
            width: neckWidth,
            height: 18,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        ]}
      />

      {/* Shoulders - follows actual shoulder landmarks */}
      <View
        style={[
          styles.bodyPart,
          bodyPartStyle,
          {
            left: shoulderLeft - 5,
            top: shoulderTop - 3,
            width: actualShoulderWidth + 10,
            height: Math.max(chestY - shoulderTop + 8, 25),
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          },
        ]}
      />

      {/* Chest - interpolated between shoulders and hips */}
      <View
        style={[
          styles.bodyPart,
          bodyPartStyle,
          {
            left: chestCenterX - chestWidth / 2,
            top: chestY - 5,
            width: chestWidth,
            height: Math.max(waistY - chestY + 8, 25),
          },
        ]}
      />

      {/* Waist - interpolated, follows body taper */}
      <View
        style={[
          styles.bodyPart,
          bodyPartStyle,
          {
            left: waistCenterX - waistWidth / 2,
            top: waistY - 5,
            width: waistWidth,
            height: Math.max(hipTop - waistY + 8, 25),
          },
        ]}
      />

      {/* Hips - follows actual hip landmarks */}
      <View
        style={[
          styles.bodyPart,
          bodyPartStyle,
          {
            left: hipLeft - 5,
            top: hipTop - 5,
            width: actualHipWidth + 10,
            height: 30,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          },
        ]}
      />

      {/* Left Leg - follows actual hip position */}
      <View
        style={[
          styles.bodyPart,
          bodyPartStyle,
          {
            left: leftLegX,
            top: hipY + 20,
            width: legWidth,
            height: legHeight,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          },
        ]}
      />

      {/* Right Leg - follows actual hip position */}
      <View
        style={[
          styles.bodyPart,
          bodyPartStyle,
          {
            left: rightLegX,
            top: hipY + 20,
            width: legWidth,
            height: legHeight,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          },
        ]}
      />

      {/* Arms - Only show if T-pose OR if explicitly requested */}
      {showArms && tPose && (
        <>
          {/* Left Arm - Upper */}
          <View
            style={[
              styles.bodyPart,
              bodyPartStyle,
              {
                left: Math.min(points.leftElbow.x, points.leftShoulder.x),
                top: points.leftShoulder.y - armThickness / 2,
                width: Math.abs(points.leftShoulder.x - points.leftElbow.x),
                height: armThickness,
                borderRadius: 6,
              },
            ]}
          />
          
          {/* Left Arm - Lower */}
          <View
            style={[
              styles.bodyPart,
              bodyPartStyle,
              {
                left: Math.min(points.leftWrist.x, points.leftElbow.x),
                top: points.leftElbow.y - armThickness * 0.4,
                width: Math.abs(points.leftElbow.x - points.leftWrist.x),
                height: armThickness * 0.85,
                borderRadius: 5,
              },
            ]}
          />

          {/* Right Arm - Upper */}
          <View
            style={[
              styles.bodyPart,
              bodyPartStyle,
              {
                left: Math.min(points.rightShoulder.x, points.rightElbow.x),
                top: points.rightShoulder.y - armThickness / 2,
                width: Math.abs(points.rightElbow.x - points.rightShoulder.x),
                height: armThickness,
                borderRadius: 6,
              },
            ]}
          />
          
          {/* Right Arm - Lower */}
          <View
            style={[
              styles.bodyPart,
              bodyPartStyle,
              {
                left: Math.min(points.rightElbow.x, points.rightWrist.x),
                top: points.rightElbow.y - armThickness * 0.4,
                width: Math.abs(points.rightWrist.x - points.rightElbow.x),
                height: armThickness * 0.85,
                borderRadius: 5,
              },
            ]}
          />
        </>
      )}

      {/* Arms Down - Follow actual elbow and wrist landmarks */}
      {showArms && armsDown && !tPose && (
        <>
          {/* Left Upper Arm - shoulder to elbow */}
          <View
            style={[
              styles.bodyPart,
              bodyPartStyle,
              {
                left: Math.min(points.leftShoulder.x, points.leftElbow.x) - armThickness * 0.4,
                top: points.leftShoulder.y,
                width: armThickness * 0.8,
                height: Math.abs(points.leftElbow.y - points.leftShoulder.y),
                borderRadius: 4,
              },
            ]}
          />
          
          {/* Left Lower Arm - elbow to wrist */}
          <View
            style={[
              styles.bodyPart,
              bodyPartStyle,
              {
                left: Math.min(points.leftElbow.x, points.leftWrist.x) - armThickness * 0.35,
                top: points.leftElbow.y - 3,
                width: armThickness * 0.7,
                height: Math.abs(points.leftWrist.y - points.leftElbow.y) + 6,
                borderBottomLeftRadius: 6,
                borderBottomRightRadius: 6,
              },
            ]}
          />

          {/* Right Upper Arm - shoulder to elbow */}
          <View
            style={[
              styles.bodyPart,
              bodyPartStyle,
              {
                left: Math.max(points.rightShoulder.x, points.rightElbow.x) - armThickness * 0.4,
                top: points.rightShoulder.y,
                width: armThickness * 0.8,
                height: Math.abs(points.rightElbow.y - points.rightShoulder.y),
                borderRadius: 4,
              },
            ]}
          />
          
          {/* Right Lower Arm - elbow to wrist */}
          <View
            style={[
              styles.bodyPart,
              bodyPartStyle,
              {
                left: Math.max(points.rightElbow.x, points.rightWrist.x) - armThickness * 0.35,
                top: points.rightElbow.y - 3,
                width: armThickness * 0.7,
                height: Math.abs(points.rightWrist.y - points.rightElbow.y) + 6,
                borderBottomLeftRadius: 6,
                borderBottomRightRadius: 6,
              },
            ]}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bodyPart: {
    position: 'absolute',
  },
});

export default BodyOutlineOverlay;
