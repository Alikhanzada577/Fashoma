import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.backArrow}>←</Text>
  </TouchableOpacity>
);

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplayRegular: PlayfairDisplay_400Regular,
    ManropeRegular: Manrope_400Regular,
    InterRegular: Inter_400Regular,
  });

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

  const handleSignIn = () => {
    console.log('Sign in pressed');
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign in pressed');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleSignUpPress = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Access your personal wardrobe and recommendations.</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            rightIcon={<EyeIcon />}
          />
          
          <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.signInButtonShadow}>
          <Button title="Sign In" onPress={handleSignIn} style={styles.signInButton} />
        </View>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
        >
          <Image 
            source={require('@/assets/images/Logo-google-icon-PNG.png')} 
            style={styles.googleIcon}
            resizeMode="contain"
          />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>Not a member? </Text>
          <TouchableOpacity onPress={handleSignUpPress}>
            <Text style={styles.signUpLink}>Sign Up</Text>
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
  form: {
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.secondary,
  },
  signInButtonShadow: {
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
  signInButton: {
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
    paddingBottom: 34,
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.secondary,
  },
  signUpLink: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
});