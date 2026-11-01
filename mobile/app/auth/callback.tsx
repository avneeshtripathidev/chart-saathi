import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import queryString from 'query-string';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Train } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../src/utils/theme';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

export default function AuthCallbackScreen() {
  const { isProfileComplete, refreshProfile } = useAuth();

  useEffect(() => {
    let isCancelled = false;

    async function handleAuthCallback() {
      try {
        // On mobile native, extract session tokens or auth code from deep link URL
        if (Platform.OS !== 'web') {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            let access_token: string | null = null;
            let refresh_token: string | null = null;
            let code: string | null = null;

            const hashIdx = initialUrl.indexOf('#');
            if (hashIdx !== -1) {
              const hash = initialUrl.substring(hashIdx + 1);
              const parsed = queryString.parse(hash);
              access_token = (parsed.access_token as string) || null;
              refresh_token = (parsed.refresh_token as string) || null;
            }

            const queryIdx = initialUrl.indexOf('?');
            if (queryIdx !== -1) {
              const query = initialUrl.substring(queryIdx + 1);
              const parsed = queryString.parse(query);
              if (!access_token && parsed.access_token) access_token = parsed.access_token as string;
              if (!refresh_token && parsed.refresh_token) refresh_token = parsed.refresh_token as string;
              if (parsed.code) code = parsed.code as string;
            }

            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            } else if (code) {
              await supabase.auth.exchangeCodeForSession(code);
            }
          }
        }

        // Allow Supabase client to parse URL hash/query in web or deep link
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          if (!isCancelled) {
            router.replace('/login');
          }
          return;
        }

        const profile = await refreshProfile();
        if (isCancelled) return;

        const hasCompleteProfile = Boolean(
          profile?.full_name?.trim() && profile?.mobile_number?.trim()
        );

        if (hasCompleteProfile || isProfileComplete) {
          router.replace('/');
        } else {
          router.replace('/complete-profile');
        }
      } catch (err) {
        if (!isCancelled) {
          router.replace('/login');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isCancelled = true;
    };
  }, [isProfileComplete, refreshProfile]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Train size={32} color={colors.brand.primary} />
        </View>
        <ActivityIndicator size="large" color={colors.brand.primary} style={styles.spinner} />
        <Text style={styles.statusText}>Completing authentication...</Text>
        <Text style={styles.subText}>Please wait while we set up your secure session.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
