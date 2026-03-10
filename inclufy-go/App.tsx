import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './src/services/supabase';
import AppNavigator from './src/navigation/AppNavigator';
import BiometricScreen from './src/screens/BiometricScreen';
import { colors } from './src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
  },
});

const BIOMETRIC_ENABLED_KEY = 'inclufy_go_biometric_enabled';

/** Safe biometric check — returns false on error */
async function checkBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const LocalAuth = await import('expo-local-authentication');
    const hasHardware = await LocalAuth.hasHardwareAsync();
    const isEnrolled = await LocalAuth.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricPassed, setBiometricPassed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      clearTimeout(timeout);

      if (session) {
        try {
          const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
          const available = await checkBiometricAvailable();

          if (biometricEnabled === 'true' && available) {
            setShowBiometric(true);
          } else {
            setBiometricPassed(true);
          }
        } catch {
          setBiometricPassed(true);
        }
      } else {
        setBiometricPassed(true);
      }

      setLoading(false);
    }).catch(() => {
      setLoading(false);
      clearTimeout(timeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session && _event === 'SIGNED_IN') {
        try {
          const available = await checkBiometricAvailable();
          if (available) {
            const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
            if (biometricEnabled === null) {
              setShowBiometric(true);
              setBiometricPassed(false);
              return;
            }
          }
        } catch {
          // Ignore biometric errors
        }
        setBiometricPassed(true);
      }

      if (!session) {
        setBiometricPassed(false);
        setShowBiometric(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleBiometricSuccess = async () => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    } catch {}
    setBiometricPassed(true);
    setShowBiometric(false);
  };

  const handleBiometricSkip = async () => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
    } catch {}
    setBiometricPassed(true);
    setShowBiometric(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show biometric screen if needed (only on native, after login)
  if (session && showBiometric && !biometricPassed) {
    return (
      <BiometricScreen
        onSuccess={handleBiometricSuccess}
        onSkip={handleBiometricSkip}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AppNavigator isLoggedIn={!!session} />
        <StatusBar style="dark" />
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
