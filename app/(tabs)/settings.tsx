import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { PlayfairDisplay_400Regular_Italic, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope';
import { router } from 'expo-router';
import { hasAvatar, clearAvatarData } from '@/services/avatar.storage.service';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasAvatarData, setHasAvatarData] = useState(false);
  
  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
  });

  // Check if avatar exists
  useEffect(() => {
    const checkAvatar = async () => {
      const exists = await hasAvatar();
      setHasAvatarData(exists);
    };
    checkAvatar();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const settingsOptions = [
    { id: 1, title: 'Profile Overview', action: () => {} },
    { id: 2, title: 'Edit Measurements', action: () => router.push('/avatar/review-twin') },
    { id: 3, title: 'Privacy & Data Controls', action: () => {} },
    { id: 4, title: 'Family Profiles', action: () => {} },
    { id: 5, title: 'App Preferences', action: () => {} },
  ];

  const handleResetAvatar = () => {
    Alert.alert(
      'Reset Avatar',
      'This will delete all your current photos and measurements. You\'ll need to take new photos to get new measurements.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete & Start Fresh',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAvatarData();
              setHasAvatarData(false);
              // Navigate to create avatar flow
              router.push('/avatar/create-twin');
            } catch (error) {
              console.error('Error clearing avatar data:', error);
              Alert.alert('Error', 'Failed to reset avatar data');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Settings Menu Items */}
        <View style={styles.menuContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.menuItem,
                index === settingsOptions.length - 1 && styles.lastMenuItem,
              ]}
              onPress={option.action}
            >
              <Text style={styles.menuItemText}>{option.title}</Text>
              <View style={styles.chevronCircle}>
                <Ionicons name="chevron-forward" size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Avatar Actions */}
        <View style={styles.avatarActionsContainer}>
          <Text style={styles.sectionLabel}>AVATAR</Text>
          
          {hasAvatarData ? (
            <>
              {/* Reset Avatar Button */}
              <TouchableOpacity 
                style={styles.resetAvatarButton} 
                onPress={handleResetAvatar}
              >
                <View style={styles.resetAvatarContent}>
                  <Ionicons name="refresh-outline" size={22} color={Colors.primary} />
                  <View style={styles.resetAvatarTextContainer}>
                    <Text style={styles.resetAvatarTitle}>Reset Avatar</Text>
                    <Text style={styles.resetAvatarSubtitle}>Delete photos & retake measurements</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.createAvatarButton} 
              onPress={() => router.push('/avatar/create-twin')}
            >
              <View style={styles.resetAvatarContent}>
                <Ionicons name="body-outline" size={22} color={Colors.primary} />
                <View style={styles.resetAvatarTextContainer}>
                  <Text style={styles.resetAvatarTitle}>Create Avatar</Text>
                  <Text style={styles.resetAvatarSubtitle}>Take photos to get your measurements</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={isSigningOut}
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text style={styles.logoutText}>
            {isSigningOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'ManropeRegular',
    color: Colors.text.primary,
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Avatar Actions
  avatarActionsContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'ManropeMedium',
    color: Colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  resetAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  createAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  resetAvatarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetAvatarTextContainer: {
    flex: 1,
  },
  resetAvatarTitle: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.text.primary,
  },
  resetAvatarSubtitle: {
    fontSize: 12,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: '#DC2626',
    fontWeight: '500',
  },
});
