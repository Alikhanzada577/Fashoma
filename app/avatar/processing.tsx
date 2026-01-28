import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { PlayfairDisplay_400Regular_Italic, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';
import { router, useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProcessingScreen() {
  const params = useLocalSearchParams();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    ManropeRegular: Manrope_400Regular,
  });

  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Rotate animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    // Simulate processing and navigate to review screen after 3 seconds
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/avatar/review-twin',
        params: params,
      });
    }, 3000);

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
      clearTimeout(timer);
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray[50]} />

      <View style={styles.content}>
        {/* Animated Circles */}
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.outerCircle,
              {
                opacity: pulseAnim,
                transform: [{ rotate: spin }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.middleCircle,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0.3, 1],
                  outputRange: [0.5, 0.8],
                }),
              },
            ]}
          />
          <View style={styles.innerCircle} />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Refining your digital{'\n'}essence</Text>
          <Text style={styles.subtitle}>
            Our intelligence is harmonizing with{'\n'}your unique proportions.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  outerCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(143, 175, 154, 0.15)',
  },
  middleCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(143, 175, 154, 0.25)',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(143, 175, 154, 0.4)',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
