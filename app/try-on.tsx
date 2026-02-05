/**
 * Try-On Screen
 * 
 * Virtual try-on that overlays garments on the user's body photo.
 * Shows: category tabs, product info, garment overlay on user photo, size selector.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { router } from 'expo-router';

import { TryOnRenderer } from '@/components/TryOn/TryOnRenderer';
import { 
  getAvatarData,
  getAdjustedLandmarks,
  AvatarMeasurements, 
  hasAvatar 
} from '@/services/avatar.storage.service';
import { BodyLandmarks, BodyDimensions } from '@/services/pose.service';
import { GarmentType, GARMENT_COLORS } from '@/config/bodyRegions.config';
import { SizeChart } from '@/data/mockProducts';
import { Product, ProductSize, ImageSource } from '@/config/products.types';
import { getAllProducts, getProductSize, LOCAL_PRODUCT_IMAGES } from '@/config/products.mock';
import { 
  analyzeProductFit, 
  getAllSizeRecommendations,
  getFitStatusColor,
} from '@/services/fit.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Category type
type CategoryType = 'tshirt' | 'pants';

// Convert Product sizes to SizeChart format for TryOnRenderer
const productSizesToSizeChart = (sizes: ProductSize[]): SizeChart => {
  const chart: SizeChart = {};
  sizes.forEach(size => {
    chart[size.label] = {
      chest: size.chestWidth,
      shoulders: size.shoulderWidth,
      length: size.length,
      sleeves: size.sleeveLength,
      waist: size.waistWidth,
      hips: size.hipWidth,
      inseam: size.inseam,
    };
  });
  return chart;
};

/**
 * Helper to convert ImageSource to ImageSourcePropType
 */
const getImageSource = (source: ImageSource | undefined | null): ImageSourcePropType | undefined => {
  if (!source) return undefined;
  if (typeof source === 'number') {
    return source as ImageSourcePropType;
  }
  return { uri: source };
};

export default function TryOnScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [userMeasurements, setUserMeasurements] = useState<AvatarMeasurements | null>(null);
  const [hasAvatarData, setHasAvatarData] = useState(false);
  const [userPhotoUri, setUserPhotoUri] = useState<string | null>(null);
  
  // Landmarks for precise garment positioning
  const [landmarks, setLandmarks] = useState<BodyLandmarks | null>(null);
  const [bodyDimensions, setBodyDimensions] = useState<BodyDimensions | null>(null);
  
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('tshirt');
  
  // Products from mock data
  const allProducts = getAllProducts();
  
  // Filter products by category
  const products = useMemo(() => 
    allProducts.filter(p => p.type === selectedCategory),
    [allProducts, selectedCategory]
  );
  
  // Product selection
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const selectedProduct: Product | undefined = products[selectedProductIndex];
  
  // Size selection
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string>('M');
  
  // Get selected size object
  const selectedSize: ProductSize | undefined = useMemo(() => 
    selectedProduct ? getProductSize(selectedProduct, selectedSizeLabel) : undefined,
    [selectedProduct, selectedSizeLabel]
  );

  // Convert to SizeChart for TryOnRenderer
  const sizeChart: SizeChart = useMemo(() => 
    selectedProduct ? productSizesToSizeChart(selectedProduct.sizes) : {},
    [selectedProduct]
  );

  // Get all size recommendations
  const allSizeRecommendations = useMemo(() => {
    if (!userMeasurements || !selectedProduct) return [];
    return getAllSizeRecommendations(userMeasurements, selectedProduct);
  }, [userMeasurements, selectedProduct]);

  const [fontsLoaded] = useFonts({
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
  });

  // Load user measurements and landmarks
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const avatarExists = await hasAvatar();
      setHasAvatarData(avatarExists);
      
      if (avatarExists) {
        const avatarData = await getAvatarData();
        if (avatarData) {
          setUserMeasurements(avatarData.measurements);
          setUserPhotoUri(avatarData.photoUri);
          setBodyDimensions(avatarData.bodyDimensions);
          
          // Prefer adjusted landmarks if available
          const adjustedLandmarks = await getAdjustedLandmarks();
          if (adjustedLandmarks) {
            setLandmarks(adjustedLandmarks);
          } else if (avatarData.landmarks) {
            setLandmarks(avatarData.landmarks);
          }
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Reset product selection when category changes
  useEffect(() => {
    setSelectedProductIndex(0);
  }, [selectedCategory]);

  // Reset size when product changes
  useEffect(() => {
    if (selectedProduct) {
      const middleIndex = Math.floor(selectedProduct.sizes.length / 2);
      setSelectedSizeLabel(selectedProduct.sizes[middleIndex]?.label || 'M');
    }
  }, [selectedProductIndex, selectedProduct]);

  if (!fontsLoaded) {
    return null;
  }

  const handleCreateAvatar = () => {
    router.push('/avatar/create-twin');
  };

  const handleClose = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your fit data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No avatar state
  if (!hasAvatarData || !userMeasurements) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.gray[50]} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.noAvatarContainer}>
          <View style={styles.noAvatarIcon}>
            <Ionicons name="body-outline" size={64} color={Colors.gray[400]} />
          </View>
          <Text style={styles.noAvatarTitle}>Create Your Avatar First</Text>
          <Text style={styles.noAvatarSubtitle}>
            To try on clothes, we need your measurements.{'\n'}
            Create your avatar to get started.
          </Text>
          <TouchableOpacity style={styles.createAvatarButton} onPress={handleCreateAvatar}>
            <Text style={styles.createAvatarButtonText}>Create Avatar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get garment type for TryOnRenderer
  const garmentType: GarmentType = selectedCategory === 'tshirt' ? 'top' : 'bottom';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray[50]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Virtual Try-On</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          <TouchableOpacity
            style={[
              styles.categoryTab,
              selectedCategory === 'tshirt' && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory('tshirt')}
          >
            <Ionicons 
              name="shirt-outline" 
              size={18} 
              color={selectedCategory === 'tshirt' ? Colors.white : Colors.text.primary} 
            />
            <Text style={[
              styles.categoryTabText,
              selectedCategory === 'tshirt' && styles.categoryTabTextActive,
            ]}>
              T-Shirt
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.categoryTab,
              selectedCategory === 'pants' && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory('pants')}
          >
            <Ionicons 
              name="resize-outline" 
              size={18} 
              color={selectedCategory === 'pants' ? Colors.white : Colors.text.primary} 
            />
            <Text style={[
              styles.categoryTabText,
              selectedCategory === 'pants' && styles.categoryTabTextActive,
            ]}>
              Pants
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        {selectedProduct && (
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{selectedProduct.name}</Text>
            <Text style={styles.productBrand}>{selectedProduct.brand}</Text>
          </View>
        )}

        {/* Try-On Renderer - Garment on User Photo */}
        {selectedProduct && (
          <View style={styles.rendererContainer}>
            <TryOnRenderer
              userMeasurements={userMeasurements}
              garmentType={garmentType}
              selectedSize={selectedSizeLabel}
              sizeChart={sizeChart}
              garmentImage={getImageSource(selectedProduct.imageUrl)}
              garmentColor={GARMENT_COLORS[garmentType]}
              userPhotoUri={userPhotoUri}
              landmarks={landmarks}
              bodyDimensions={bodyDimensions}
            />
          </View>
        )}

        {/* Size Selector */}
        {selectedProduct && (
          <View style={styles.sizeSection}>
            <Text style={styles.sectionTitle}>SELECT SIZE</Text>
            <View style={styles.sizeSelector}>
              {selectedProduct.sizes.map((size) => {
                const recommendation = allSizeRecommendations.find(
                  r => r.size.label === size.label
                );
                const fitColor = recommendation 
                  ? getFitStatusColor(recommendation.overallFit) 
                  : Colors.gray[400];
                const isSelected = selectedSizeLabel === size.label;
                
                return (
                  <TouchableOpacity
                    key={size.label}
                    style={[
                      styles.sizeButton,
                      isSelected && styles.sizeButtonActive,
                      isSelected && { borderColor: fitColor },
                    ]}
                    onPress={() => setSelectedSizeLabel(size.label)}
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        isSelected && styles.sizeButtonTextActive,
                      ]}
                    >
                      {size.label}
                    </Text>
                    {recommendation && (
                      <View 
                        style={[
                          styles.sizeFitDot,
                          { backgroundColor: fitColor }
                        ]} 
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Size Legend */}
            <View style={styles.sizeLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: getFitStatusColor('good_fit') }]} />
                <Text style={styles.legendText}>Good Fit</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: getFitStatusColor('snug') }]} />
                <Text style={styles.legendText}>Snug</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: getFitStatusColor('too_tight') }]} />
                <Text style={styles.legendText}>Too Tight</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: getFitStatusColor('loose') }]} />
                <Text style={styles.legendText}>Loose</Text>
              </View>
            </View>
          </View>
        )}

        {/* Product Carousel (if multiple products) */}
        {products.length > 1 && (
          <View style={styles.productCarousel}>
            <Text style={styles.sectionTitle}>MORE OPTIONS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productScrollContent}
            >
              {products.map((product, index) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productCard,
                    selectedProductIndex === index && styles.productCardActive,
                  ]}
                  onPress={() => setSelectedProductIndex(index)}
                >
                  <Image
                    source={getImageSource(product.imageUrl)}
                    style={styles.productCardImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.productCardName} numberOfLines={1}>
                    {product.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Edit Avatar Link */}
        <TouchableOpacity 
          style={styles.editAvatarButton}
          onPress={() => router.push('/avatar/review-twin')}
        >
          <Ionicons name="pencil" size={16} color={Colors.primary} />
          <Text style={styles.editAvatarText}>Edit your measurements</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  // Category Tabs
  categoryTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 15,
    fontFamily: 'ManropeMedium',
    color: Colors.text.primary,
  },
  categoryTabTextActive: {
    color: Colors.white,
  },
  // Product Info
  productInfo: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 22,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  // Renderer
  rendererContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  // Size Section
  sizeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  sizeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    position: 'relative',
  },
  sizeButtonActive: {
    backgroundColor: Colors.gray[50],
  },
  sizeButtonText: {
    fontSize: 15,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
  },
  sizeButtonTextActive: {
    color: Colors.text.primary,
  },
  sizeFitDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sizeLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  // Product Carousel
  productCarousel: {
    marginBottom: 24,
  },
  productScrollContent: {
    gap: 12,
  },
  productCard: {
    width: 100,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productCardActive: {
    borderColor: Colors.primary,
  },
  productCardImage: {
    width: '100%',
    height: 80,
    backgroundColor: Colors.gray[100],
  },
  productCardName: {
    fontSize: 11,
    fontFamily: 'ManropeMedium',
    color: Colors.text.primary,
    padding: 8,
  },
  // Edit Avatar
  editAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  editAvatarText: {
    fontSize: 14,
    fontFamily: 'ManropeMedium',
    color: Colors.primary,
  },
  // No avatar state
  noAvatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  noAvatarIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  noAvatarTitle: {
    fontSize: 22,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  noAvatarSubtitle: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createAvatarButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createAvatarButtonText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
  },
});
