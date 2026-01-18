import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function VerificationCompleteScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplayRegular: PlayfairDisplay_400Regular,
    ManropeRegular: Manrope_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = () => {
    router.push('/auth/reset-password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#8FAF9A" />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Verification Complete!</Text>
          <Text style={styles.subtitle}>Please continue to create a password.</Text>
        </View>
        
        <View style={styles.buttonShadow}>
          <Button title="Continue" onPress={handleContinue} style={styles.button} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  titleContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSizes['3xl'],
    fontWeight: '400' as const,
    fontFamily: 'PlayfairDisplayRegular',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSizes.base,
    fontFamily: 'ManropeRegular',
    fontWeight: '400' as const,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeights.normal * Typography.fontSizes.base,
    textAlign: 'center',
  },
  buttonShadow: {
    marginBottom: 20,
    width: '100%',
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
  button: {
    width: '100%',
    borderRadius: 999,
    minHeight: 56,
    paddingVertical: 16,
  },
});
