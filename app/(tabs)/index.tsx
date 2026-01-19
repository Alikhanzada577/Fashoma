import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { PlayfairDisplay_400Regular, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular } from '@expo-google-fonts/manrope';

export default function HomeScreen() {
  const { user, signOut, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [fontsLoaded] = useFonts({
    PlayfairDisplayRegular: PlayfairDisplay_400Regular,
    ManropeRegular: Manrope_400Regular,
  });

  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={60} color={Colors.primary} />
          <Text style={styles.title}>Welcome to Fashoma!</Text>
          
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userIconContainer}>
            <Ionicons name="person-circle-outline" size={50} color={Colors.primary} />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name || 'N/A'}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.valueSmall}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.label}>Provider</Text>
            <Text style={styles.value}>{user?.authProvider || 'N/A'}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, user?.isEmailVerified ? styles.badgeSuccess : styles.badgeWarning]}>
                <Text style={styles.badgeText}>
                  {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.buttonContainer}>
          <Button 
            title={isSigningOut ? 'Logging out...' : 'LOGOUT'} 
            onPress={handleLogout}
            variant="primary"
            disabled={isSigningOut}
          />
        </View>

        {isSigningOut && (
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: Typography.fontSizes['2xl'],
    fontWeight: '400',
    fontFamily: 'PlayfairDisplayRegular',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    fontFamily: 'ManropeRegular',
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  userIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    marginBottom: 12,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: Typography.fontSizes.base,
    fontFamily: 'ManropeRegular',
    color: Colors.text.primary,
    fontWeight: '500',
  },
  valueSmall: {
    fontSize: Typography.fontSizes.sm,
    fontFamily: 'ManropeRegular',
    color: Colors.text.primary,
    fontWeight: '400',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#10B981',
  },
  badgeWarning: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: Typography.fontSizes.base,
    color: Colors.text.secondary,
    fontFamily: 'ManropeRegular',
  },
});
