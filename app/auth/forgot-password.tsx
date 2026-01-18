import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.backArrow}>←</Text>
  </TouchableOpacity>
);

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const [fontsLoaded] = useFonts({
    PlayfairDisplayRegular: PlayfairDisplay_400Regular,
    ManropeRegular: Manrope_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  const handleForgotPassword = () => {
    // Navigate to OTP verification
    router.push('/auth/otp-verification');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Password Recovery</Text>
          <Text style={styles.subtitle}>Enter your email to reset your password</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.buttonShadow}>
          <Button title="Forgot Password" onPress={handleForgotPassword} style={styles.button} />
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: Typography.fontSizes['3xl'],
    fontWeight: '400' as const,
    fontFamily: 'PlayfairDisplayRegular',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSizes.base,
    fontFamily: 'ManropeRegular',
    fontWeight: '400' as const,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeights.normal * Typography.fontSizes.base,
  },
  form: {
    marginBottom: 24,
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
