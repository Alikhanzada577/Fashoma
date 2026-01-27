/**
 * Authentication Context
 * Manages authentication state across the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import * as authService from '@/services/auth.service';
import { getUserData, clearAuthData } from '@/services/storage.service';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface User {
  id: string;
  name: string;
  email: string;
  authProvider: string;
  isEmailVerified: boolean;
  profilePicture: string | null;
  linkedAccounts: string[];
  createdAt: string;
  lastLogin: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load user data on mount
   */
  useEffect(() => {
    loadUser();
  }, []);

  /**
   * Load user from storage
   */
  const loadUser = async () => {
    try {
      const isAuth = await authService.checkAuth();
      if (isAuth) {
        const userData = await getUserData();
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Google Login
   */
  const googleLogin = async (idToken: string) => {
    try {
      const response = await authService.googleLogin({ idToken });
      setUser(response.user);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Register user
   */
  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authService.register({ name, email, password });
      setUser(response.user);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Sign out user
   */
  const signOut = async () => {
    try {
      await authService.signOut();
      
      // Also sign out from Google to allow account selection on next sign-in
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // Ignore Google sign out errors (user might not have signed in with Google)
        console.log('Google sign out skipped:', googleError);
      }
      
      setUser(null);
      
      // Navigate to sign in
      router.replace('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear local state even if API call fails
      setUser(null);
      await clearAuthData();
      
      // Try to sign out from Google anyway
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // Ignore
      }
      
      router.replace('/auth/signin');
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const userData = await getUserData();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    googleLogin,
    register,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
