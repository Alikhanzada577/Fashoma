import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.backArrow}>←</Text>
  </TouchableOpacity>
);

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const EyeIcon = () => (
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
    </TouchableOpacity>
  );

  const handleBack = () => {
    router.back();
  };

  const handleSignUp = () => {
    console.log('Sign up pressed');
  };

  const handleGoogleSignUp = () => {
    console.log('Google sign up pressed');
  };

  const handleSignInPress = () => {
    router.push('/auth/signin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create Profile</Text>
          <Text style={styles.subtitle}>Begin your journey to confident, personalized shopping.</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder=""
          />
          
          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder=""
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder=""
            secureTextEntry={!showPassword}
            rightIcon={<EyeIcon />}
          />
        </View>
        
        <Button title="Sign Up" onPress={handleSignUp} style={styles.signUpButton} />
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <Button
          title="Continue with Google"
          onPress={handleGoogleSignUp}
          variant="outline"
          style={styles.googleButton}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already a member?{' '}
          <TouchableOpacity onPress={handleSignInPress}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </Text>
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
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSizes.base,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeights.normal * Typography.fontSizes.base,
  },
  form: {
    marginBottom: 24,
  },
  signUpButton: {
    marginBottom: 24,
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
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  footerText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.secondary,
  },
  signInLink: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  eyeIcon: {
    fontSize: 16,
  },
});