import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { PlayfairDisplay_400Regular_Italic, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, isLoading } = useAuth();

  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
  });

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const userName = user?.name?.split(' ')[0] || 'There';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Ionicons name="person-circle-outline" size={40} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Empty State Illustration */}
        <View style={styles.emptyStateContainer}>
          <View style={styles.illustrationContainer}>
            {/* Clipboard illustrations using icons and shapes */}
            <View style={[styles.clipboard, styles.clipboardBack]}>
              <View style={styles.clipboardClip} />
              <View style={styles.clipboardContent} />
            </View>
            <View style={[styles.clipboard, styles.clipboardFront]}>
              <View style={styles.clipboardClip} />
              <View style={styles.clipboardContent} />
            </View>
          </View>

          <Text style={styles.emptyStateTitle}>No recommendations yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Beauty emerges from the void.{'\n'}
            Begin your curation to breathe life into this{'\n'}
            space.
          </Text>

          {/* Initiate Curation Button */}
          <TouchableOpacity 
            style={styles.curationButton}
            onPress={() => router.push('/avatar/create-twin')}
          >
            <Text style={styles.curationButtonText}>Initiate Curation</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: Colors.white,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyStateContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 60,
  },
  illustrationContainer: {
    width: 200,
    height: 180,
    marginBottom: 32,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboard: {
    position: 'absolute',
    width: 120,
    height: 140,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.gray[300],
  },
  clipboardBack: {
    transform: [{ rotate: '-15deg' }, { translateX: -20 }],
    opacity: 0.6,
  },
  clipboardFront: {
    transform: [{ rotate: '8deg' }, { translateX: 15 }],
  },
  clipboardClip: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 16,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    opacity: 0.8,
  },
  clipboardContent: {
    margin: 20,
    marginTop: 28,
    height: 80,
    backgroundColor: Colors.gray[100],
    borderRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  curationButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  curationButtonText: {
    fontSize: 16,
    fontFamily: 'ManropeMedium',
    color: Colors.white,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
