import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { validateName, validateEmail, validatePassword } from '@/utils/validation';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from '@/config/google.config';

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
  </TouchableOpacity>
);

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  const insets = useSafeAreaInsets();

  const { register, googleLogin } = useAuth();

  const [fontsLoaded] = useFonts({
    PlayfairDisplayRegular: PlayfairDisplay_400Regular,
    ManropeRegular: Manrope_400Regular,
    InterRegular: Inter_400Regular,
  });

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_CONFIG.webClientId,
      offlineAccess: GOOGLE_CONFIG.offlineAccess,
      scopes: [...GOOGLE_CONFIG.scopes],
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const EyeIcon = () => (
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Ionicons 
        name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
        size={20} 
        color={Colors.text.secondary} 
      />
    </TouchableOpacity>
  );

  const handleBack = () => {
    router.back();
  };

  const handleSignUp = async () => {
    // Clear previous errors
    setErrors({ name: '', email: '', password: '' });

    // Validate inputs
    const nameValidation = validateName(fullName);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!nameValidation.isValid || !emailValidation.isValid || !passwordValidation.isValid) {
      setErrors({
        name: nameValidation.error || '',
        email: emailValidation.error || '',
        password: passwordValidation.error || '',
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(fullName.trim(), email.trim().toLowerCase(), password);
      // Navigation is handled by AuthContext
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Check if Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      // Get the ID token
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) {
        throw new Error('Failed to get Google ID token');
      }
      
      // Send the ID token to your backend
      await googleLogin(idToken);
      
    } catch (error: any) {
      console.error('Google Sign-Up Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        Alert.alert('Cancelled', 'Google Sign-Up was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign in is in progress already
        Alert.alert('In Progress', 'Sign up is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        // Other errors
        Alert.alert(
          'Google Sign-Up Failed', 
          error.message || 'An error occurred during Google Sign-Up'
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignInPress = () => {
    router.push({
      pathname: '/auth/signin',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
     
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {/* <BackButton onPress={handleBack} /> */}
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create Profile</Text>
          <Text style={styles.subtitle}>Begin your journey to confident, personalized shopping.</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            placeholder="Full Name"
            error={errors.name}
            editable={!isLoading}
          />
          
          <Input
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            editable={!isLoading}
          />
          
          <Input
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            placeholder="Password"
            secureTextEntry={!showPassword}
            rightIcon={<EyeIcon />}
            error={errors.password}
            editable={!isLoading}
          />
        </View>
        
        <View style={styles.signUpButtonShadow}>
          <Button 
            title={isLoading ? 'Signing Up...' : 'Sign Up'} 
            onPress={handleSignUp} 
            style={styles.signUpButton}
            disabled={isLoading}
          />
        </View>
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <TouchableOpacity 
          style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
          onPress={handleGoogleSignUp}
          activeOpacity={0.8}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color={Colors.text.primary} />
          ) : (
            <>
              <Image 
                source={require('@/assets/images/Logo-google-icon-PNG.png')} 
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>Already a member? </Text>
          <TouchableOpacity onPress={handleSignInPress}>
            <Text style={styles.signInLink}>Sign In</Text>
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
    paddingTop: 40, // Added padding since header is removed
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
  signUpButtonShadow: {
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
  signUpButton: {
    width: '100%',
    borderRadius: 999,
    minHeight: 56,
    paddingVertical: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[300],
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.secondary,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    paddingVertical: 4,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 10,
    backgroundColor: Colors.white,
    marginBottom: 24,
    overflow: 'hidden',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: Typography.fontSizes.base,
    fontFamily: 'InterRegular',
    fontWeight: '400' as const,
    color: Colors.text.primary,
    letterSpacing: 1.2,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.secondary,
  },
  signInLink: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
});