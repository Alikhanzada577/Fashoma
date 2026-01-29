import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { PlayfairDisplay_400Regular_Italic, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';

export default function CameraPermissionScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleGrantAccess = async () => {
    // Request camera permission
    const result = await requestPermission();
    
    if (result.granted) {
      // Permission granted, navigate to choose method
      router.push('/avatar/choose-method');
    } else if (!result.canAskAgain) {
      // Permission permanently denied, show alert to open settings
      Alert.alert(
        'Camera Permission Required',
        'Camera access is required to create your digital twin. Please enable it in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      // Permission denied but can ask again
      Alert.alert(
        'Permission Denied',
        'Camera access is needed to create your avatar. Please grant permission to continue.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNotNow = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray[50]} />
      
      <View style={styles.content}>
        {/* White Card Container */}
        <View style={styles.card}>
          {/* Camera Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera" size={48} color={Colors.primary} />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>See Your Style</Text>
            <Text style={styles.titleItalic}>in Motion</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            To create your digital twin, we need{'\n'}
            to briefly use your camera.
          </Text>

          {/* Privacy Notice */}
          <Text style={styles.privacyText}>
            Your privacy is our priority-images{'\n'}
            are processed locally and never{'\n'}
            stored without your consent.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.grantButton}
              onPress={handleGrantAccess}
              activeOpacity={0.8}
            >
              <Text style={styles.grantButtonText}>Grant Access</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notNowButton}
              onPress={handleNotNow}
              activeOpacity={0.8}
            >
              <Text style={styles.notNowText}>Not Now</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Badge */}
          <View style={styles.privacyBadge}>
            <Ionicons name="lock-closed" size={12} color={Colors.text.light} />
            <Text style={styles.privacyBadgeText}>END-TO-END PRIVATE</Text>
          </View>
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
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  titleItalic: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    fontFamily: 'ManropeRegular',
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  grantButton: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantButtonText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
    fontWeight: '500',
  },
  notNowButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowText: {
    fontSize: 16,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontFamily: 'ManropeRegular',
    color: Colors.text.light,
    letterSpacing: 1,
  },
});
