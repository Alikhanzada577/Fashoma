/**
 * Mock Product Data for Testing
 * 
 * Contains sample products with size charts and garment images for 2.5D try-on.
 * In production, this would come from the backend API.
 */

import { GarmentType } from '@/config/bodyRegions.config';
import { ImageSourcePropType } from 'react-native';

export interface SizeChart {
  [size: string]: {
    chest?: number;    // cm
    waist?: number;    // cm
    hips?: number;     // cm
    inseam?: number;   // cm
    shoulders?: number; // cm
  };
}

export interface MockProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  garmentType: GarmentType;
  sizeChart: SizeChart;
  availableSizes: string[];
  // Real garment image for try-on overlay
  garmentImage: ImageSourcePropType;
  // Fallback color if image fails to load
  placeholderColor: string;
}

// Import garment images - use relative path for reliability
const TshirtFrontImage = require('../assets/Product/Tshirt-front-photo.png');

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'tshirt-001',
    name: 'Classic Cotton T-Shirt',
    brand: 'Essentials',
    price: 29.99,
    currency: 'USD',
    garmentType: 'top',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    garmentImage: TshirtFrontImage,
    placeholderColor: '#FFFFFF', // White T-shirt
    sizeChart: {
      XS: { chest: 86, waist: 71, shoulders: 40 },
      S: { chest: 91, waist: 76, shoulders: 42 },
      M: { chest: 97, waist: 81, shoulders: 44 },
      L: { chest: 102, waist: 86, shoulders: 46 },
      XL: { chest: 107, waist: 91, shoulders: 48 },
    },
  },
  {
    id: 'pants-001',
    name: 'Slim Fit Chinos',
    brand: 'Urban Style',
    price: 59.99,
    currency: 'USD',
    garmentType: 'bottom',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    // TODO: Add pants image when available
    garmentImage: TshirtFrontImage, // Placeholder - replace with pants image
    placeholderColor: '#5D4037', // Brown
    sizeChart: {
      XS: { hips: 86, waist: 71, inseam: 76 },
      S: { hips: 91, waist: 76, inseam: 78 },
      M: { hips: 97, waist: 81, inseam: 80 },
      L: { hips: 102, waist: 86, inseam: 82 },
      XL: { hips: 107, waist: 91, inseam: 84 },
    },
  },
];

/**
 * Get a product by ID
 */
export const getProductById = (id: string): MockProduct | undefined => {
  return MOCK_PRODUCTS.find(p => p.id === id);
};

/**
 * Get all products
 */
export const getAllProducts = (): MockProduct[] => {
  return MOCK_PRODUCTS;
};
