/**
 * Body Regions Configuration for T-Pose
 * 
 * Defines normalized coordinates (0-1) for body regions on a T-pose image.
 * These anchors are used to position and scale garment overlays.
 * 
 * Coordinate system:
 * - (0, 0) = top-left of the image
 * - (1, 1) = bottom-right of the image
 * - x: horizontal (0 = left, 1 = right)
 * - y: vertical (0 = top, 1 = bottom)
 */

export interface BodyRegion {
  id: string;
  label: string;
  // Normalized bounding box
  topY: number;
  bottomY: number;
  leftX: number;
  rightX: number;
  // Center anchor point
  centerX: number;
  centerY: number;
  // Which measurements affect this region
  measurements: ('shoulders' | 'chest' | 'waist' | 'hips' | 'inseam')[];
}

/**
 * T-Pose body regions
 * 
 * Visual layout:
 * 
 *          0        0.5        1
 *          |         |         |
 *     0  --+---------+---------+--
 *          |  (head) |         |
 *    0.08  +----[SHOULDERS]----+   <- top of T-shirt region
 *          |         |         |
 *          |  UPPER  |         |   <- T-shirt covers this
 *          |  TORSO  |         |
 *    0.35  +---------+---------+   <- chest midpoint
 *          |  LOWER  |         |
 *          |  TORSO  |         |
 *    0.48  +---------+---------+   <- waist / T-shirt bottom, pants top
 *          |  HIPS   |         |
 *    0.58  +---------+---------+   
 *          |         |         |
 *          |  LEGS   |         |   <- pants cover this
 *          |         |         |
 *     1  --+---------+---------+--
 */

export const BODY_REGIONS: Record<string, BodyRegion> = {
  // Upper torso: covers shoulders, chest, waist - for T-shirts, tops
  upperTorso: {
    id: 'upperTorso',
    label: 'Upper Torso',
    topY: 0.08,
    bottomY: 0.48,
    leftX: 0.15,
    rightX: 0.85,
    centerX: 0.5,
    centerY: 0.28,
    measurements: ['shoulders', 'chest', 'waist'],
  },
  
  // Lower torso + legs: covers hips, legs - for pants, trousers
  lowerBody: {
    id: 'lowerBody',
    label: 'Lower Body',
    topY: 0.46,
    bottomY: 0.98,
    leftX: 0.25,
    rightX: 0.75,
    centerX: 0.5,
    centerY: 0.72,
    measurements: ['hips', 'inseam'],
  },
};

/**
 * Garment type to body region mapping
 */
export type GarmentType = 'top' | 'bottom' | 'dress' | 'outerwear';

export const GARMENT_REGION_MAP: Record<GarmentType, string[]> = {
  top: ['upperTorso'],
  bottom: ['lowerBody'],
  dress: ['upperTorso', 'lowerBody'],
  outerwear: ['upperTorso'],
};

/**
 * Get the primary measurement for scaling a garment type
 */
export const getPrimaryMeasurement = (garmentType: GarmentType): 'chest' | 'hips' => {
  switch (garmentType) {
    case 'top':
    case 'outerwear':
      return 'chest';
    case 'bottom':
      return 'hips';
    case 'dress':
      return 'chest';
    default:
      return 'chest';
  }
};
