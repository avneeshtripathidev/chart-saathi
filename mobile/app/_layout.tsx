import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Stack, useSegments, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/utils/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60, // 1 min default
      gcTime: 1000 * 60 * 10, // 10 min garbage collect
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, isProfileComplete } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const route = segments.join('/');
    const isAuthRoute =
      route === 'login' ||
      route === 'verify-email' ||
      route === 'auth/callback';
    const isProfileRoute = route === 'complete-profile';

    if (!session) {
      if (!isAuthRoute) {
        router.replace('/login');
      }
    } else if (!isProfileComplete) {
      if (!isProfileRoute && route !== 'auth/callback') {
        router.replace('/complete-profile');
      }
    } else {
      if (isAuthRoute || isProfileRoute) {
        router.replace('/');
      }
    }
  }, [session, isLoading, isProfileComplete, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isLargeWeb = Platform.OS === 'web' && width > 480;

  const stackContent = (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.primary },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: colors.bg.primary },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      <Stack.Screen
        name="results"
        options={{ title: 'Chart Vacancy', headerBackTitle: 'Home' }}
      />
      <Stack.Screen
        name="coaches"
        options={{ title: 'Coach Explorer', headerBackTitle: 'Results' }}
      />
      <Stack.Screen
        name="berths"
        options={{ title: 'Berth Layout', headerBackTitle: 'Coaches' }}
      />
      <Stack.Screen
        name="berth-detail"
        options={{ title: 'Berth Details', presentation: 'modal', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings & Info', headerBackTitle: 'Back' }}
      />
    </Stack>
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" backgroundColor={colors.bg.primary} />
          {isLargeWeb ? (
            <View style={styles.webOuter}>
              <View style={styles.deviceFrame}>
                <View style={styles.notchBar}>
                  <View style={styles.islandPill}>
                    <View style={styles.cameraDot} />
                  </View>
                </View>
                <View style={styles.screenContent}>
                  <AuthGuard>{stackContent}</AuthGuard>
                </View>
                <View style={styles.homeBar}>
                  <View style={styles.homeIndicator} />
                </View>
              </View>
            </View>
          ) : (
            <AuthGuard>{stackContent}</AuthGuard>
          )}
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webOuter: {
    flex: 1,
    minHeight: '100vh' as any,
    backgroundColor: '#181619',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 18,
    overflowY: 'auto' as any,
  },
  deviceFrame: {
    width: 390,
    height: 844,
    maxHeight: 844,
    backgroundColor: colors.bg.primary,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: '#343136',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.75,
    shadowRadius: 40,
    elevation: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  notchBar: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    pointerEvents: 'none' as any,
  },
  islandPill: {
    width: 106,
    height: 24,
    backgroundColor: '#141215',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  cameraDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#070607',
  },
  screenContent: {
    flex: 1,
    paddingTop: 12,
  },
  homeBar: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none' as any,
  },
  homeIndicator: {
    width: 134,
    height: 4,
    backgroundColor: 'rgba(245, 240, 233, 0.35)',
    borderRadius: 2,
  },
});
