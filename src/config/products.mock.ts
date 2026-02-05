/**
 * Mock Product Data for Fashoma
 * 
 * Dummy shirt data with realistic measurements for each size.
 * These measurements are based on typical men's shirt sizing charts.
 */

import { Product, ProductSize } from './products.types';

// Local product images
export const LOCAL_PRODUCT_IMAGES = {
  tshirtFront: require('@/assets/Product/Tshirt-front-photo.png'),
};

/**
 * Standard shirt sizes with realistic measurements (in cm)
 * Based on typical men's shirt sizing
 */
const STANDARD_SHIRT_SIZES: ProductSize[] = [
  { 
    label: 'XS', 
    chestWidth: 44, 
    shoulderWidth: 40, 
    length: 66, 
    sleeveLength: 18 
  },
  { 
    label: 'S', 
    chestWidth: 48, 
    shoulderWidth: 42, 
    length: 68, 
    sleeveLength: 19 
  },
  { 
    label: 'M', 
    chestWidth: 52, 
    shoulderWidth: 45, 
    length: 70, 
    sleeveLength: 20 
  },
  { 
    label: 'L', 
    chestWidth: 56, 
    shoulderWidth: 48, 
    length: 72, 
    sleeveLength: 21 
  },
  { 
    label: 'XL', 
    chestWidth: 60, 
    shoulderWidth: 51, 
    length: 74, 
    sleeveLength: 22 
  },
  { 
    label: 'XXL', 
    chestWidth: 64, 
    shoulderWidth: 54, 
    length: 76, 
    sleeveLength: 23 
  },
];

/**
 * Slim fit sizes (narrower measurements)
 */
const SLIM_FIT_SIZES: ProductSize[] = [
  { 
    label: 'S', 
    chestWidth: 46, 
    shoulderWidth: 41, 
    length: 68, 
    sleeveLength: 19 
  },
  { 
    label: 'M', 
    chestWidth: 49, 
    shoulderWidth: 43, 
    length: 70, 
    sleeveLength: 20 
  },
  { 
    label: 'L', 
    chestWidth: 52, 
    shoulderWidth: 46, 
    length: 72, 
    sleeveLength: 21 
  },
  { 
    label: 'XL', 
    chestWidth: 56, 
    shoulderWidth: 49, 
    length: 74, 
    sleeveLength: 22 
  },
];

/**
 * Relaxed/oversized fit sizes (wider measurements)
 */
const RELAXED_FIT_SIZES: ProductSize[] = [
  { 
    label: 'S', 
    chestWidth: 52, 
    shoulderWidth: 46, 
    length: 70, 
    sleeveLength: 20 
  },
  { 
    label: 'M', 
    chestWidth: 56, 
    shoulderWidth: 49, 
    length: 72, 
    sleeveLength: 21 
  },
  { 
    label: 'L', 
    chestWidth: 60, 
    shoulderWidth: 52, 
    length: 74, 
    sleeveLength: 22 
  },
  { 
    label: 'XL', 
    chestWidth: 64, 
    shoulderWidth: 55, 
    length: 76, 
    sleeveLength: 23 
  },
];

/**
 * Mock product database
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'shirt-001',
    name: 'Classic Cotton T-Shirt',
    type: 'tshirt',
    brand: 'Fashoma Basics',
    description: 'A timeless cotton t-shirt with a comfortable regular fit. Perfect for everyday wear.',
    imageUrl: LOCAL_PRODUCT_IMAGES.tshirtFront,
    sizes: STANDARD_SHIRT_SIZES,
    price: 29.99,
    color: 'Black/Maroon',
    material: '100% Cotton',
  },
  {
    id: 'shirt-002',
    name: 'Slim Fit Premium Tee',
    type: 'tshirt',
    brand: 'Urban Style',
    description: 'Modern slim fit t-shirt crafted from premium cotton blend. Tapered silhouette for a sleek look.',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    sizes: SLIM_FIT_SIZES,
    price: 39.99,
    color: 'Black',
    material: '95% Cotton, 5% Elastane',
  },
  {
    id: 'shirt-003',
    name: 'Oversized Comfort Tee',
    type: 'tshirt',
    brand: 'Chill Wear',
    description: 'Relaxed oversized fit for maximum comfort. Drop shoulders and extended length.',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
    sizes: RELAXED_FIT_SIZES,
    price: 34.99,
    color: 'Navy Blue',
    material: '100% Organic Cotton',
  },
  {
    id: 'shirt-004',
    name: 'Athletic Performance Shirt',
    type: 'tshirt',
    brand: 'ActiveFit',
    description: 'Moisture-wicking performance t-shirt designed for workouts and active lifestyles.',
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400',
    sizes: [
      { label: 'S', chestWidth: 47, shoulderWidth: 42, length: 67, sleeveLength: 18 },
      { label: 'M', chestWidth: 50, shoulderWidth: 44, length: 69, sleeveLength: 19 },
      { label: 'L', chestWidth: 54, shoulderWidth: 47, length: 71, sleeveLength: 20 },
      { label: 'XL', chestWidth: 58, shoulderWidth: 50, length: 73, sleeveLength: 21 },
    ],
    price: 44.99,
    color: 'Charcoal Grey',
    material: '88% Polyester, 12% Spandex',
  },
  {
    id: 'shirt-005',
    name: 'Vintage Wash Crew Neck',
    type: 'tshirt',
    brand: 'Retro Revival',
    description: 'Soft vintage wash t-shirt with a lived-in feel. Classic crew neck design.',
    imageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400',
    sizes: STANDARD_SHIRT_SIZES,
    price: 32.99,
    color: 'Faded Green',
    material: '100% Cotton (Pre-washed)',
  },
];

/**
 * Get all mock products
 */
export const getAllProducts = (): Product[] => {
  return MOCK_PRODUCTS;
};

/**
 * Get a product by ID
 */
export const getProductById = (id: string): Product | undefined => {
  return MOCK_PRODUCTS.find(p => p.id === id);
};

/**
 * Get products by type
 */
export const getProductsByType = (type: Product['type']): Product[] => {
  return MOCK_PRODUCTS.filter(p => p.type === type);
};

/**
 * Get a specific size from a product
 */
export const getProductSize = (product: Product, sizeLabel: string): ProductSize | undefined => {
  return product.sizes.find(s => s.label === sizeLabel);
};

/**
 * Get available size labels for a product
 */
export const getAvailableSizes = (product: Product): string[] => {
  return product.sizes.map(s => s.label);
};
