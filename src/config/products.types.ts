/**
 * Product Types for Fashoma
 * 
 * Defines the structure of products with size-specific measurements.
 * Used for size-accurate virtual try-on.
 */

/**
 * Size-specific measurements for a product (in cm)
 */
export interface ProductSize {
  /** Size label (S, M, L, XL, etc.) */
  label: string;
  /** Chest/bust width in cm */
  chestWidth: number;
  /** Shoulder width (seam to seam) in cm */
  shoulderWidth: number;
  /** Length from shoulder to hem in cm */
  length: number;
  /** Sleeve length in cm (for tops with sleeves) */
  sleeveLength: number;
  /** Waist width in cm (for fitted garments or pants) */
  waistWidth?: number;
  /** Hip width in cm (for pants/skirts) */
  hipWidth?: number;
  /** Inseam length in cm (for pants) */
  inseam?: number;
}

/**
 * Product type categories
 */
export type ProductType = 'shirt' | 'tshirt' | 'pants' | 'dress' | 'jacket' | 'sweater';

/**
 * Image source type - supports both local (require) and remote (URL) images
 * Local images from require() return a number (module ID)
 * Remote images are string URLs
 */
export type ImageSource = number | string;

/**
 * Product data structure
 */
export interface Product {
  /** Unique product identifier */
  id: string;
  /** Product name */
  name: string;
  /** Product type */
  type: ProductType;
  /** Brand name */
  brand: string;
  /** Product description */
  description: string;
  /** Main product image - can be local (require) or remote URL */
  imageUrl: ImageSource;
  /** Additional product images */
  additionalImages?: ImageSource[];
  /** Available sizes with measurements */
  sizes: ProductSize[];
  /** Price in USD */
  price: number;
  /** Product color */
  color: string;
  /** Material/fabric */
  material: string;
}

/**
 * Fit status after comparing user measurements to product size
 */
export type FitStatus = 'too_tight' | 'snug' | 'good_fit' | 'relaxed' | 'loose';

/**
 * Fit analysis result for a specific measurement
 */
export interface FitAnalysis {
  /** The measurement being compared (shoulders, chest, etc.) */
  measurement: string;
  /** User's measurement in cm */
  userValue: number;
  /** Product's measurement in cm */
  productValue: number;
  /** Difference (product - user) in cm */
  difference: number;
  /** Fit status */
  status: FitStatus;
  /** Human-readable fit description */
  description: string;
}

/**
 * Overall fit recommendation for a product size
 */
export interface FitRecommendation {
  /** The size being evaluated */
  size: ProductSize;
  /** Individual fit analyses */
  analyses: FitAnalysis[];
  /** Overall fit status */
  overallFit: FitStatus;
  /** Overall recommendation message */
  recommendation: string;
  /** Confidence score 0-100 */
  confidence: number;
}
