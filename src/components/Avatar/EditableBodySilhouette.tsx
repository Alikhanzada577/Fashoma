/**
 * Editable Body Silhouette Component
 * 
 * Draws a polygon outline connecting MediaPipe landmark points.
 * Users can drag individual points to adjust the silhouette.
 * Uses react-native-svg for drawing and PanResponder for touch handling.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import Svg, { Polygon, Circle, Line } from 'react-native-svg';
import { BodyLandmarks, Landmark } from '@/services/pose.service';

// Landmark keys that form the body outline
type EditableLandmarkKey = 
  | 'nose'
  | 'leftShoulder' | 'rightShoulder'
  | 'leftElbow' | 'rightElbow'
  | 'leftWrist' | 'rightWrist'
  | 'leftHip' | 'rightHip'
  | 'leftKnee' | 'rightKnee'
  | 'leftAnkle' | 'rightAnkle';

const EDITABLE_LANDMARKS: EditableLandmarkKey[] = [
  'nose',
  'leftShoulder', 'rightShoulder',
  'leftElbow', 'rightElbow',
  'leftWrist', 'rightWrist',
  'leftHip', 'rightHip',
  'leftKnee', 'rightKnee',
  'leftAnkle', 'rightAnkle',
];

// Order of points to form the body outline polygon
// Goes: neck -> right arm -> right body -> right leg -> left leg -> left body -> left arm -> back to neck
const BODY_OUTLINE_ORDER: EditableLandmarkKey[] = [
  'nose',           // Head/neck reference
  'rightShoulder',  // Right shoulder
  'rightElbow',     // Right arm
  'rightWrist',     // Right hand
  'rightElbow',     // Back up arm
  'rightShoulder',  // Back to shoulder
  'rightHip',       // Right hip
  'rightKnee',      // Right knee
  'rightAnkle',     // Right ankle
  'leftAnkle',      // Cross to left ankle
  'leftKnee',       // Left knee
  'leftHip',        // Left hip
  'leftShoulder',   // Left shoulder
  'leftElbow',      // Left arm
  'leftWrist',      // Left hand
  'leftElbow',      // Back up arm
  'leftShoulder',   // Back to shoulder
];

interface EditableBodySilhouetteProps {
  /** Current body landmarks */
  landmarks: BodyLandmarks;
  /** Callback when landmarks are changed by user */
  onLandmarksChange?: (landmarks: BodyLandmarks) => void;
  /** Container width */
  width: number;
  /** Container height */
  height: number;
  /** Original image aspect ratio */
  imageAspectRatio?: number;
  /** Whether points are editable/draggable */
  editable?: boolean;
  /** Stroke color for the outline */
  strokeColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Fill color for the silhouette */
  fillColor?: string;
  /** Point handle color */
  handleColor?: string;
  /** Point handle radius */
  handleRadius?: number;
  /** When false, hide only the skeleton/connection lines; dotted points stay visible. Default true. */
  showSkeletonLines?: boolean;
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

const EditableBodySilhouette: React.FC<EditableBodySilhouetteProps> = ({
  landmarks,
  onLandmarksChange,
  width,
  height,
  imageAspectRatio = 0.75,
  editable = true,
  strokeColor = '#FFFFFF',
  strokeWidth = 2.5,
  fillColor = 'rgba(80, 120, 100, 0.3)',
  handleColor = '#FFFFFF',
  handleRadius = 8,
  showSkeletonLines = true,
}) => {
  const [activePoint, setActivePoint] = useState<EditableLandmarkKey | null>(null);

  // Calculate image bounds
  const bounds = useMemo(() => 
    calculateContainedImageBounds(width, height, imageAspectRatio),
    [width, height, imageAspectRatio]
  );

  // Convert normalized coordinates (0-1) to pixel coordinates
  const toPixel = useCallback((landmark: Landmark) => ({
    x: bounds.offsetX + landmark.x * bounds.displayedWidth,
    y: bounds.offsetY + landmark.y * bounds.displayedHeight,
  }), [bounds]);

  // Convert pixel coordinates back to normalized (0-1)
  const toNormalized = useCallback((pixelX: number, pixelY: number) => ({
    x: Math.max(0, Math.min(1, (pixelX - bounds.offsetX) / bounds.displayedWidth)),
    y: Math.max(0, Math.min(1, (pixelY - bounds.offsetY) / bounds.displayedHeight)),
  }), [bounds]);

  // Get all point positions in pixels
  const pointPositions = useMemo(() => {
    const positions: Record<EditableLandmarkKey, { x: number; y: number }> = {} as any;
    for (const key of EDITABLE_LANDMARKS) {
      const landmark = landmarks[key];
      if (landmark) {
        positions[key] = toPixel(landmark);
      }
    }
    return positions;
  }, [landmarks, toPixel]);

  // Generate polygon points string for SVG
  const polygonPoints = useMemo(() => {
    return BODY_OUTLINE_ORDER
      .map(key => {
        const pos = pointPositions[key];
        return pos ? `${pos.x},${pos.y}` : '';
      })
      .filter(Boolean)
      .join(' ');
  }, [pointPositions]);

  // Handle point drag
  const handlePointDrag = useCallback((
    key: EditableLandmarkKey,
    gestureState: PanResponderGestureState
  ) => {
    if (!editable || !onLandmarksChange) return;

    const currentPos = pointPositions[key];
    if (!currentPos) return;

    const newPixelX = currentPos.x + gestureState.dx;
    const newPixelY = currentPos.y + gestureState.dy;
    const normalized = toNormalized(newPixelX, newPixelY);

    // Create updated landmarks
    const updatedLandmarks: BodyLandmarks = {
      ...landmarks,
      [key]: {
        ...landmarks[key],
        x: normalized.x,
        y: normalized.y,
      },
    };

    // Also update the raw array if it exists
    if (landmarks.raw) {
      updatedLandmarks.raw = [...landmarks.raw];
    }

    onLandmarksChange(updatedLandmarks);
  }, [editable, onLandmarksChange, pointPositions, toNormalized, landmarks]);

  // Create pan responders for each draggable point
  const createPanResponder = useCallback((key: EditableLandmarkKey) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => editable,
      onMoveShouldSetPanResponder: () => editable,
      onPanResponderGrant: () => {
        setActivePoint(key);
      },
      onPanResponderMove: (_, gestureState) => {
        handlePointDrag(key, gestureState);
      },
      onPanResponderRelease: () => {
        setActivePoint(null);
      },
      onPanResponderTerminate: () => {
        setActivePoint(null);
      },
    });
  }, [editable, handlePointDrag]);

  // Memoize pan responders
  const panResponders = useMemo(() => {
    const responders: Record<EditableLandmarkKey, ReturnType<typeof PanResponder.create>> = {} as any;
    for (const key of EDITABLE_LANDMARKS) {
      responders[key] = createPanResponder(key);
    }
    return responders;
  }, [createPanResponder]);

  // Generate connecting lines between related points
  const connectionLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];
    
    // Torso connections
    const connections: Array<[EditableLandmarkKey, EditableLandmarkKey]> = [
      // Shoulders
      ['leftShoulder', 'rightShoulder'],
      // Arms
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftWrist'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightWrist'],
      // Torso
      ['leftShoulder', 'leftHip'],
      ['rightShoulder', 'rightHip'],
      ['leftHip', 'rightHip'],
      // Legs
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftAnkle'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightAnkle'],
      // Neck
      ['nose', 'leftShoulder'],
      ['nose', 'rightShoulder'],
    ];

    for (const [from, to] of connections) {
      const fromPos = pointPositions[from];
      const toPos = pointPositions[to];
      if (fromPos && toPos) {
        lines.push({
          x1: fromPos.x,
          y1: fromPos.y,
          x2: toPos.x,
          y2: toPos.y,
          key: `${from}-${to}`,
        });
      }
    }

    return lines;
  }, [pointPositions]);

  if (width <= 0 || height <= 0) return null;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents={editable ? 'auto' : 'none'}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Filled polygon silhouette - hidden when toggle off so only dots show */}
        {showSkeletonLines && (
          <Polygon
            points={polygonPoints}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        )}

        {/* Connection lines (skeleton) - hidden when showSkeletonLines is false */}
        {showSkeletonLines && connectionLines.map(line => (
          <Line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.6}
            strokeLinecap="round"
            opacity={0.7}
          />
        ))}

        {/* Draggable point handles (dots) - always visible */}
        {EDITABLE_LANDMARKS.map(key => {
          const pos = pointPositions[key];
          if (!pos) return null;

          const isActive = activePoint === key;

          return (
            <Circle
              key={key}
              cx={pos.x}
              cy={pos.y}
              r={isActive ? handleRadius * 1.3 : handleRadius}
              fill={isActive ? '#4CAF50' : handleColor}
              stroke={strokeColor}
              strokeWidth={2}
              opacity={editable ? 1 : 0.6}
            />
          );
        })}
      </Svg>

      {/* Invisible touch targets for each point */}
      {editable && EDITABLE_LANDMARKS.map(key => {
        const pos = pointPositions[key];
        if (!pos) return null;
        
        const touchSize = handleRadius * 4;
        
        return (
          <View
            key={`touch-${key}`}
            style={[
              styles.touchTarget,
              {
                left: pos.x - touchSize / 2,
                top: pos.y - touchSize / 2,
                width: touchSize,
                height: touchSize,
              },
            ]}
            {...panResponders[key].panHandlers}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  touchTarget: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});

export default EditableBodySilhouette;
