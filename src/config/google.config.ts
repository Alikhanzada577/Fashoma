/**
 * Google Sign-In Configuration
 */

export const GOOGLE_CONFIG = {
  // Web Client ID - This is the main client ID you'll use
  // Get this from Google Cloud Console > APIs & Credentials
  webClientId: '54755150318-2dk5bq6rk27b5h7mlmlu2q3ro5ca0anj.apps.googleusercontent.com',
  
  // iOS Client ID - Create this in Google Cloud Console for iOS
  // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  
  // Scopes you want to access
  scopes: ['profile', 'email'],
  
  // Offline access to get refresh token
  offlineAccess: true,
} as const;
