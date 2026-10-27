import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type UserProfile } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  signInWithGoogle: () => Promise<{ error: Error | null; url?: string | null }>;
  sendEmailOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  saveProfile: (fullName: string, mobileNumber: string, countryCode?: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Check if profile has mandatory full name and mobile number
  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    const hasName = Boolean(profile.full_name && profile.full_name.trim().length > 0);
    const hasMobile = Boolean(profile.mobile_number && profile.mobile_number.trim().length > 0);
    return hasName && hasMobile;
  }, [profile]);

  // Load user profile from Supabase
  const loadProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error loading profile from Supabase:', error.message);
        return null;
      }

      setProfile(data as UserProfile | null);
      return data as UserProfile | null;
    } catch (err: any) {
      console.warn('Unexpected error in loadProfile:', err?.message);
      return null;
    }
  }, []);

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Error getting session:', error.message);
        }

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await loadProfile(initialSession.user.id);
          }
        }
      } catch (err) {
        console.warn('Auth initialization exception:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Google OAuth sign-in
  const signInWithGoogle = useCallback(async (): Promise<{ error: Error | null; url?: string | null }> => {
    try {
      const redirectUrl = Platform.OS === 'web'
        ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:8081/auth/callback')
        : Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { error };
      }

      if (Platform.OS === 'web' && data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }

      return { error: null, url: data?.url };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  // Send Email 6-digit OTP
  const sendEmailOtp = useCallback(async (email: string): Promise<{ error: Error | null }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return { error };
      }

      setPendingEmail(trimmedEmail);
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  // Verify Email OTP
  const verifyEmailOtp = useCallback(async (email: string, token: string): Promise<{ error: Error | null }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const cleanedToken = token.trim();

      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: cleanedToken,
        type: 'email',
      });

      if (error) {
        return { error };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        await loadProfile(data.session.user.id);
      }

      setPendingEmail(null);
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [loadProfile]);

  // Save/Update Profile
  const saveProfile = useCallback(async (
    fullName: string,
    mobileNumber: string,
    countryCode: string = '+91'
  ): Promise<{ error: Error | null }> => {
    try {
      const currentUser = session?.user;
      if (!currentUser) {
        return { error: new Error('User is not authenticated. Please log in.') };
      }

      const trimmedName = fullName.trim();
      const cleanedMobile = mobileNumber.replace(/\D/g, '');
      const trimmedCode = countryCode.trim();

      const profilePayload: UserProfile = {
        id: currentUser.id,
        full_name: trimmedName,
        mobile_number: cleanedMobile,
        country_code: trimmedCode,
        updated_at: new Date().toISOString(),
      };

      // Upsert into public.profiles
      const { data, error: dbError } = await supabase
        .from('profiles')
        .upsert(profilePayload)
        .select()
        .single();

      if (dbError) {
        return { error: new Error(dbError.message || 'Failed to save profile.') };
      }

      // Keep user metadata in sync
      await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          mobile_number: cleanedMobile,
          country_code: trimmedCode,
        },
      });

      setProfile(data as UserProfile);
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [session]);

  // Refresh Profile
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) return null;
    return await loadProfile(user.id);
  }, [user, loadProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setPendingEmail(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      isLoading,
      isProfileComplete,
      pendingEmail,
      setPendingEmail,
      signInWithGoogle,
      sendEmailOtp,
      verifyEmailOtp,
      saveProfile,
      refreshProfile,
      signOut,
    }),
    [
      session,
      user,
      profile,
      isLoading,
      isProfileComplete,
      pendingEmail,
      signInWithGoogle,
      sendEmailOtp,
      verifyEmailOtp,
      saveProfile,
      refreshProfile,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
