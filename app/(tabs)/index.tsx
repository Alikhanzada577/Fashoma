import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  TouchableOpacity, 
  StatusBar, 
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { PlayfairDisplay_400Regular_Italic, useFonts } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { router } from 'expo-router';
import { hasAvatar } from '@/services/avatar.storage.service';
import { LOCAL_PRODUCT_IMAGES } from '@/config/products.mock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Product interface for display
interface DisplayProduct {
  id: string;
  name: string;
  subtitle: string;
  image: any; // ImageSourcePropType
}

// Mock featured products using local t-shirt image
const FEATURED_PRODUCTS: DisplayProduct[] = [
  {
    id: 'featured-1',
    name: 'The Classic Cotton Tee',
    subtitle: 'Designed to suit your proportions',
    image: LOCAL_PRODUCT_IMAGES.tshirtFront,
  },
  {
    id: 'featured-2',
    name: 'Premium Comfort Fit',
    subtitle: 'Tailored for your measurements',
    image: LOCAL_PRODUCT_IMAGES.tshirtFront,
  },
  {
    id: 'featured-3',
    name: 'Essential Daily Wear',
    subtitle: 'Perfect match for your body type',
    image: LOCAL_PRODUCT_IMAGES.tshirtFront,
  },
  {
    id: 'featured-4',
    name: 'Modern Slim Cut',
    subtitle: 'Styled for your silhouette',
    image: LOCAL_PRODUCT_IMAGES.tshirtFront,
  },
];

// Complementary products
const COMPLEMENTARY_PRODUCTS: DisplayProduct[] = [
  {
    id: 'comp-1',
    name: 'Casual Comfort Tee',
    subtitle: 'Soft texture match',
    image: LOCAL_PRODUCT_IMAGES.tshirtFront,
  },
  {
    id: 'comp-2',
    name: 'Relaxed Fit Shirt',
    subtitle: 'Structured shoulder',
    image: LOCAL_PRODUCT_IMAGES.tshirtFront,
  },
];

// Recently aligned products
const RECENT_PRODUCTS: DisplayProduct[] = [
  {
    id: 'recent-1',
    name: 'Weekend Essential',
    subtitle: 'Breathable drape',
    image: LOCAL_PRODUCT_IMAGES.tshirtFront,
  },
  {
    id: 'recent-2',
    name: 'Urban Street Style',
    subtitle: 'Vertical alignment',
    image: LOCAL_PRODUCT_IMAGES.tshirtFront,
  },
];

export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [hasAvatarData, setHasAvatarData] = useState(false);
  const [isCheckingAvatar, setIsCheckingAvatar] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplayItalic: PlayfairDisplay_400Regular_Italic,
    ManropeRegular: Manrope_400Regular,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
  });

  // Check if user has avatar data
  useEffect(() => {
    const checkAvatar = async () => {
      setIsCheckingAvatar(true);
      const exists = await hasAvatar();
      setHasAvatarData(exists);
      setIsCheckingAvatar(false);
    };
    checkAvatar();
  }, []);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleProductPress = (product: DisplayProduct) => {
    // Navigate to try-on screen
    router.push('/try-on');
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 48));
    setActiveSlide(slideIndex);
  };

  if (!fontsLoaded || authLoading || isCheckingAvatar) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const userName = user?.name?.split(' ')[0] || 'There';

  // Show empty state if no avatar
  if (!hasAvatarData) {
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

        {/* Empty State */}
        <View style={styles.emptyContent}>
          <View style={styles.emptyStateContainer}>
            <View style={styles.illustrationContainer}>
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

  // Show product recommendations
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

        {/* Styled for you - Featured Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Styled for you</Text>
          
          <FlatList
            ref={flatListRef}
            data={FEATURED_PRODUCTS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.featuredCard}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.9}
              >
                <View style={styles.featuredImageContainer}>
                  <Image
                    source={item.image}
                    style={styles.featuredImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.featuredName}>{item.name}</Text>
                <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            )}
          />
          
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {FEATURED_PRODUCTS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeSlide === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Pairs naturally with your fit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pairs naturally with your fit</Text>
          <View style={styles.productGrid}>
            {COMPLEMENTARY_PRODUCTS.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleProductPress(product)}
                activeOpacity={0.9}
              >
                <View style={styles.productImageContainer}>
                  <Image
                    source={product.image}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSubtitle}>{product.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recently aligned with your profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently aligned with your profile</Text>
          <View style={styles.productGrid}>
            {RECENT_PRODUCTS.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleProductPress(product)}
                activeOpacity={0.9}
              >
                <View style={styles.productImageContainer}>
                  <Image
                    source={product.image}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSubtitle}>{product.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Header
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
  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplayItalic',
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  // Featured Carousel
  carouselContent: {
    paddingRight: 24,
  },
  featuredCard: {
    width: SCREEN_WIDTH - 48,
    marginRight: 16,
  },
  featuredImageContainer: {
    width: '100%',
    height: 340,
    backgroundColor: Colors.gray[100],
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImage: {
    width: '80%',
    height: '90%',
  },
  featuredName: {
    fontSize: 20,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  featuredSubtitle: {
    fontSize: 14,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[300],
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
  },
  // Product Grid
  productGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  productCard: {
    flex: 1,
  },
  productImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '80%',
    height: '85%',
  },
  productName: {
    fontSize: 14,
    fontFamily: 'ManropeSemiBold',
    color: Colors.text.primary,
    marginTop: 10,
  },
  productSubtitle: {
    fontSize: 12,
    fontFamily: 'ManropeRegular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  // Empty State
  emptyContent: {
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
});
