/**
 * Try-On Screen
 * 
 * 2.5D virtual try-on using T-pose approach.
 * Shows: avatar with garment overlay, size selector, fit feedback.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { router } from 'expo-router';

import { TryOnRenderer } from '@/components/TryOn/TryOnRenderer';
import { 
  getAvatarMeasurements, 
  getAvatarLandmarks, 
  getAvatarBodyDimensions,
  getAvatarData,
  AvatarMeasurements, 
  hasAvatar 
} from '@/services/avatar.storage.service';
import { BodyLandmarks, BodyDimensions } from '@/services/pose.service';
import { calculateFit, getFitStatusColor, FitResult } from '@/services/fit.service';
import { MOCK_PRODUCTS, MockProduct } from '@/data/mockProducts';

export default function TryOnScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [userMeasurements, setUserMeasurements] = useState<AvatarMeasurements | null>(null);
  const [hasAvatarData, setHasAvatarData] = useState(false);
  const [userPhotoUri, setUserPhotoUri] = useState<string | null>(null);
  
  // Landmarks for precise garment positioning
  const [landmarks, setLandmarks] = useState<BodyLandmarks | null>(null);
  const [bodyDimensions, setBodyDimensions] = useState<BodyDimensions | null>(null);
  
  // Product selection (for demo, show both products)
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const selectedProduct: MockProduct = MOCK_PRODUCTS[selectedProductIndex];
  
  // Size selection
  const [selectedSize, setSelectedSize] = useState(selectedProduct.availableSizes[2]); // Default to M
  
  // Fit result
  const [fitResult, setFitResult] = useState<FitResult | null>(null);

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
        // Load all avatar data including landmarks
        const avatarData = await getAvatarData();
        console.log('Loaded avatar data:', {
          hasPhoto: !!avatarData?.photoUri,
          hasLandmarks: !!avatarData?.landmarks,
          hasBodyDimensions: !!avatarData?.bodyDimensions,
          measurements: avatarData?.measurements,
        });
        if (avatarData) {
          setUserMeasurements(avatarData.measurements);
          setUserPhotoUri(avatarData.photoUri);
          setLandmarks(avatarData.landmarks);
          setBodyDimensions(avatarData.bodyDimensions);
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Calculate fit when measurements, product, or size changes
  useEffect(() => {
    if (userMeasurements && selectedProduct) {
      const result = calculateFit(
        userMeasurements,
        selectedProduct.sizeChart,
        selectedSize,
        selectedProduct.garmentType
      );
      setFitResult(result);
    }
  }, [userMeasurements, selectedProduct, selectedSize]);

  // Reset size when product changes
  useEffect(() => {
    setSelectedSize(selectedProduct.availableSizes[2] || selectedProduct.availableSizes[0]);
  }, [selectedProductIndex]);

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
        {/* Product Selector (Toggle between T-shirt and Pants) */}
        <View style={styles.productSelector}>
          {MOCK_PRODUCTS.map((product, index) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productTab,
                selectedProductIndex === index && styles.productTabActive,
              ]}
              onPress={() => setSelectedProductIndex(index)}
            >
              <Ionicons
                name={product.garmentType === 'top' ? 'shirt-outline' : 'resize-outline'}
                size={20}
                color={selectedProductIndex === index ? Colors.white : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.productTabText,
                  selectedProductIndex === index && styles.productTabTextActive,
                ]}
              >
                {product.garmentType === 'top' ? 'T-Shirt' : 'Pants'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{selectedProduct.name}</Text>
          <Text style={styles.productBrand}>{selectedProduct.brand}</Text>
        </View>

        {/* 2.5D Renderer */}
        <View style={styles.rendererContainer}>
          <TryOnRenderer
            userMeasurements={userMeasurements}
            garmentType={selectedProduct.garmentType}
            selectedSize={selectedSize}
            sizeChart={selectedProduct.sizeChart}
            garmentImage={selectedProduct.garmentImage}
            garmentColor={selectedProduct.placeholderColor}
            userPhotoUri={userPhotoUri}
            landmarks={landmarks}
            bodyDimensions={bodyDimensions}
          />
        </View>

        {/* Size Selector */}
        <View style={styles.sizeSection}>
          <Text style={styles.sectionTitle}>SELECT SIZE</Text>
          <View style={styles.sizeSelector}>
            {selectedProduct.availableSizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeButton,
                  selectedSize === size && styles.sizeButtonActive,
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={[
                    styles.sizeButtonText,
                    selectedSize === size && styles.sizeButtonTextActive,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fit Feedback */}
        {fitResult && (
          <View style={styles.fitSection}>
            <View
              style={[
                styles.fitBadge,
                { backgroundColor: getFitStatusColor(fitResult.status) + '20' },
              ]}
            >
              <View
                style={[
                  styles.fitDot,
                  { backgroundColor: getFitStatusColor(fitResult.status) },
                ]}
              />
              <Text
                style={[
                  styles.fitTitle,
                  { color: getFitStatusColor(fitResult.status) },
                ]}
              >
                {fitResult.title}
              </Text>
            </View>
            <Text style={styles.fitExplanation}>{fitResult.explanation}</Text>

            {/* Measurement Details */}
            {fitResult.details.length > 0 && (
              <View style={styles.detailsContainer}>
                {fitResult.details.map((detail) => (
                  <View key={detail.measurement} style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <View
                        style={[
                          styles.detailDot,
                          { backgroundColor: getFitStatusColor(detail.status) },
                        ]}
                      />
                      <Text style={styles.detailLabel}>
                        {detail.measurement.charAt(0).toUpperCase() + detail.measurement.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.detailValue}>
                      You: {detail.userValue}cm / Size: {detail.garmentValue}cm
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Your Measurements Reference - Auto-detected from pose */}
        <View style={styles.measurementsRef}>
          <View style={styles.measurementsRefHeader}>
            <Text style={styles.measurementsRefTitle}>Your Measurements</Text>
            <Text style={styles.measurementsRefBadge}>AUTO-DETECTED</Text>
          </View>
          <View style={styles.measurementsRefRow}>
            <Text style={styles.measurementsRefItem}>
              Shoulders: {userMeasurements.shoulders}cm
            </Text>
            <Text style={styles.measurementsRefItem}>
              Chest: {userMeasurements.chest}cm
            </Text>
          </View>
          <View style={styles.measurementsRefRow}>
            <Text style={styles.measurementsRefItem}>
              Waist: {userMeasurements.waist}cm
            </Text>
            <Text style={styles.measurementsRefItem}>
              Hips: {userMeasurements.hips}cm
            </Text>
          </View>
          <View style={styles.measurementsRefRow}>
            <Text style={styles.measurementsRefItem}>
              Inseam: {userMeasurements.inseam}cm
            </Text>
          </View>
        </View>
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
  // Product selector
  productSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  productTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  productTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  productTabText: {
    fontSize: 14,
    fontFamily: 'ManropeMedium',
    color: Colors.text.secondary,
  },
  productTabTextActive: {
    color: Colors.white,
  },
  // Product info
  productInfo: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 20,
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
  // Size selector
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
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
  },
  sizeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sizeButtonText: {
    fontSize: 15,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
  },
  sizeButtonTextActive: {
    color: Colors.white,
  },
  // Fit section
  fitSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  fitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  fitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  fitTitle: {
    fontSize: 15,
    fontFamily: 'ManropeSemiBold',
  },
  fitExplanation: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'ManropeMedium',
    color: Colors.text.primary,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  // Measurements reference
  measurementsRef: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 16,
  },
  measurementsRefHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  measurementsRefTitle: {
    fontSize: 12,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  measurementsRefBadge: {
    fontSize: 9,
    fontFamily: 'ManropeSemiBold',
    color: Colors.primary,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  measurementsRefRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  measurementsRefItem: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'ManropeRegular',
    color: Colors.text.primary,
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
