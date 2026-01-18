import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.backArrow}>←</Text>
  </TouchableOpacity>
);

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

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

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    router.push('/auth/verification-complete');
  };

  const handleResend = () => {
    console.log('Resend OTP');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>
            Enter the code that we have sent to {'\n'}
            xxxxxxxxxxxx12@gmail.com
          </Text>
        </View>
        
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>
        
        <View style={styles.buttonShadow}>
          <Button title="Verify" onPress={handleVerify} style={styles.button} />
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    backgroundColor: 'rgba(143, 175, 154, 0.3)',
    color: Colors.text.primary,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(143, 175, 154, 0.15)',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.secondary,
  },
  resendLink: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
});
