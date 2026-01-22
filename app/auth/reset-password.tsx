import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resetPassword } from '@/services/auth.service';
import { validatePassword, validatePasswordMatch } from '@/utils/validation';

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
  </TouchableOpacity>
);

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string || '';
  const otp = params.otp as string || '';
  const insets = useSafeAreaInsets();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });

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

  const EyeIcon = ({ isVisible, onToggle }: { isVisible: boolean; onToggle: () => void }) => (
    <TouchableOpacity onPress={onToggle}>
      <Ionicons 
        name={isVisible ? 'eye-outline' : 'eye-off-outline'} 
        size={20} 
        color={Colors.text.secondary} 
      />
    </TouchableOpacity>
  );

  const handleResetPassword = async () => {
    // Clear previous errors
    setErrors({ password: '', confirmPassword: '' });

    // Validate password
    const passwordValidation = validatePassword(password);
    const matchValidation = validatePasswordMatch(password, confirmPassword);

    if (!passwordValidation.isValid || !matchValidation.isValid) {
      setErrors({
        password: passwordValidation.error || '',
        confirmPassword: matchValidation.error || '',
      });
      return;
    }

    if (!email || !otp) {
      Alert.alert('Error', 'Missing verification data. Please start over.');
      router.push('/auth/forgot-password');
      return;
    }

    setIsLoading(true);

    try {
      const message = await resetPassword({
        email,
        otp,
        newPassword: password,
      });

      Alert.alert('Success', message, [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/auth/signin');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <BackButton onPress={handleBack} />
      </View>
      
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create a new password</Text>
          <Text style={styles.subtitle}>
            Your new password must be different from previous used passwords.
          </Text>
        </View>
        
        <View style={styles.form}>
          <Input
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            placeholder="Password"
            secureTextEntry={!showPassword}
            rightIcon={<EyeIcon isVisible={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
            error={errors.password}
            editable={!isLoading}
          />
          
          <Input
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            rightIcon={<EyeIcon isVisible={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />}
            error={errors.confirmPassword}
            editable={!isLoading}
          />
        </View>
        
        <View style={styles.buttonShadow}>
          <Button 
            title={isLoading ? 'Resetting...' : 'Reset Password'} 
            onPress={handleResetPassword} 
            style={styles.button}
            disabled={isLoading}
          />
        </View>
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
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
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
});
