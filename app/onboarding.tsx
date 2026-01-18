import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Inter_500Medium } from '@expo-google-fonts/inter';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const onboardingData = [
  {
    title: ['Enjoy', 'Shopping Again'],
    description: 'Discover safashion from brands around the world, with confidence in how it’s likely to fit-before you buy.',
    hasIllustration: true,
  },
  {
    title: ['Your personal shopper,', 'in your pocket.'],
    description: 'Fashoma helps you explore styles, build outfits, and see what works for your body. Whether you love fashion or find shopping overwhelming, we\'re here to make it easier-and more enjoyable.',
    hasIllustration: false,
  },
  {
    title: ['Confidence', 'before checkout.'],
    description: 'No more guessing sizes or buying multiples "just in case". Fashoma helps you shop calmly, clearly, and at your own pace-so fashion feels good, not stressful.',
    hasIllustration: false,
  },
  {
    title: ['Private by Design'],
    subtitle: 'A more considered way to shop.',
    features: [
      { title: 'Secure Encryption', description: 'Your data stays private.', icon: 'shield-checkmark-outline' },
      { title: 'Private by Default', description: 'Your photos and measurements stay under your control.', icon: 'eye-off-outline' },
      { title: 'You\'re in Control', description: 'You decide what\'s kept or deleted.', icon: 'lock-closed-outline' },
    ],
    hasIllustration: false,
  },
];

const ProgressDots = ({ total, current }: { total: number; current: number }) => (
  <View style={styles.dotsContainer}>
    {Array.from({ length: total }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          index === current ? styles.activeDot : styles.inactiveDot,
        ]}
      />
    ))}
  </View>
);

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const currentData = onboardingData[currentStep];

  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    PlayfairDisplayRegular: PlayfairDisplay_400Regular,
    PlayfairDisplayMedium: PlayfairDisplay_500Medium,
    ManropeMedium:  Manrope_400Regular,
    InterMedium: Inter_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/auth/signup');
    }
  };

  const handleSkip = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      <View
        style={[
          styles.content,
          currentStep === 3 && styles.contentLeft,
        ]}
      >
        <View
          style={[
            styles.titleContainer,
            currentStep === 3 && styles.titleContainerLeft,
          ]}
        >
          {currentData.title.map((line, index) => {
           
            const isItalicPlayfairLine =
              (currentStep === 0 && index === 0) ||
              (currentStep === 1 && index === 0) ||
              (currentStep === 2 && index === 0);
            const isRegularPlayfairLine =
              (currentStep === 0 && index === 1) ||
              (currentStep === 1 && index === 1) ||
              (currentStep === 2 && index === 1);
            const isMediumPlayfairLine =
              currentStep === 3 && index === 0;

            return (
              <Text 
                key={index} 
                style={[
                  styles.title,
                  currentStep === 3 && styles.titleLeft,
                  isItalicPlayfairLine && {
                    fontFamily: 'PlayfairDisplayItalic',
                    fontStyle: 'italic',
                  },
                  isRegularPlayfairLine && {
                    fontFamily: 'PlayfairDisplayRegular',
                    fontStyle: 'normal',
                  },
                  isMediumPlayfairLine && {
                    fontFamily: 'PlayfairDisplayRegular',
                    fontStyle: 'normal',
                  },
                  !isItalicPlayfairLine &&
                    !isRegularPlayfairLine &&
                    !isMediumPlayfairLine && { fontStyle: 'normal' },
                ]}
              >
                {line}
              </Text>
            );
          })}
          {currentData.subtitle && (
            <Text
              style={[
                styles.subtitle,
                currentStep === 3 && styles.subtitleLeft,
              ]}
            >
              {currentData.subtitle}
            </Text>
          )}
        </View>
        
        {currentData.description && (
         <View style={styles.descriptionWrapper}>
        {currentStep === 1 && (
  <View style={[styles.blurCircle, styles.blurRight]}>
    <View style={styles.blurColorLayer} />
    <BlurView intensity={20} tint="default" style={StyleSheet.absoluteFill} />
  </View>
)}

{currentStep === 2 && (
  <View style={[styles.blurCircle, styles.blurLeft]}>
    <View style={styles.blurColorLayer} />
    <BlurView intensity={20} tint="default" style={StyleSheet.absoluteFill} />
  </View>
)}

         <Text style={styles.description}>{currentData.description}</Text>
       </View>
        )}
        
        {currentData.hasIllustration && (
          <LinearGradient
            colors={['#DFE3DE', '#DFE3DE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.illustrationContainer}
          >
            <View style={styles.capsule}>
              <Ionicons name="person" size={45} color="#FFFFFF" />
            </View>
          </LinearGradient>
        )}
        
        {currentData.features && (
          <View style={styles.featuresContainer}>
            {currentData.features.map((feature, index) => (
              <View key={index} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={22} color={Colors.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        <View style={styles.nextButtonShadow}>
          <Button 
            title={currentStep === onboardingData.length - 1 ? "GET STARTED" : "NEXT"} 
            onPress={handleNext} 
            style={styles.nextButton} 
          />
        </View>
        <ProgressDots total={onboardingData.length} current={currentStep} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3', // Very subtle warm off-white
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 17,
    color: '#495850',
    fontWeight: '400' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentLeft: {
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainerLeft: {
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '400' as const,
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleLeft: {
    textAlign: 'left',
    width: '100%',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  subtitleLeft: {
    textAlign: 'left',
    width: '100%',
  },
  descriptionWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    maxWidth: 360,
    width: '100%',
    overflow: 'visible',
  },
  floatingCircle: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 195,
    backgroundColor: '#8FAF9A',
   
    left: '-10%',
    top: '80%',
    transform: [
      { translateX: -195 },
      { translateY: -195 }
    ],
    zIndex: -1,
  },
  blurCircle: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    overflow: 'hidden',
    zIndex: -1,
  },
  
  blurColorLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8FAF9A',
    opacity: 0.5,
  },
  
  blurLeft: {
    left: '-10%',
    top: '80%',
    transform: [
      { translateX: -195 },
      { translateY: -195 },
    ],
  },
  
  blurRight: {
    right: '10%',
    top: '80%',
    transform: [
      { translateX: 195 },
      { translateY: -165 },
    ],
  },
  
  floatingCircleRight: {
    left: 'auto',
    right: '10%',
    transform: [
      { translateX: 195 },
      { translateY: -165 }
    ],
   
  },
  description: {
    fontSize: 17,
    fontWeight: '300' as const,
    fontFamily: 'ManropeMedium',
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
    paddingHorizontal: 16,
    maxWidth: 360,
  },
  illustrationContainer: {
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 40,
    width: '100%',
  },
  capsule: {
    width: 160,
    height: 270,
    backgroundColor: '#F0F1EF',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  featuresContainer: {
    paddingHorizontal: 20,
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 16,
    marginTop: 2,
    padding:8,
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  featureContent: {
    flex: 1,
    paddingVertical: 10,
  },
  featureTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: '600' as const,
    fontFamily: 'InterMedium',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  nextButton: {
    width: '100%',
    borderRadius: 999,
  },
  nextButtonShadow: {
    marginBottom: 20,
    width: '100%',
    maxWidth: 500,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        
        shadowColor: '#8FAF9A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 20px rgba(143, 175, 154, 1)',
      },
    }),
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#6B7280',
  },
  inactiveDot: {
    backgroundColor: '#D1D5DB',
  },
});
