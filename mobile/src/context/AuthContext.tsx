import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type UserProfile, type NotificationPreferences, type PrivacySettings } from '../lib/supabase';
import { API_BASE_URL } from '../utils/config';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  // Auth methods
  signInWithGoogle: () => Promise<{ error: Error | null; url?: string | null }>;
  sendEmailOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; user?: User | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null; session?: Session | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  // Profile & preferences
  checkUsernameAvailable: (username: string) => Promise<{ available: boolean; message: string }>;
  saveProfile: (
    fullName: string,
    mobileNumber: string,
    countryCode?: string,
    username?: string,
    avatarUrl?: string
  ) => Promise<{ error: Error | null }>;
  updatePreferences: (
    notifications?: Partial<NotificationPreferences>,
    privacy?: Partial<PrivacySettings>
  ) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
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

  // Check if profile is complete (onboarding_completed flag or name + mobile)
  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    if (profile.onboarding_completed) return true;
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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
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

      if (error) return { error };

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

      if (error) return { error };

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

      if (error) return { error };

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

  // Sign up with Email + Password
  const signUpWithPassword = useCallback(async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ error: Error | null; user?: User | null }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || '',
          },
        },
      });

      if (error) return { error };

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        if (data.session.user) {
          await loadProfile(data.session.user.id);
        }
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [loadProfile]);

  // Sign in with Email + Password
  const signInWithPassword = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: Error | null; session?: Session | null }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) return { error };

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        if (data.session.user) {
          await loadProfile(data.session.user.id);
        }
      }

      return { error: null, session: data.session };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [loadProfile]);

  // Forgot password reset link
  const resetPasswordForEmail = useCallback(async (email: string): Promise<{ error: Error | null }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const redirectUrl = Platform.OS === 'web'
        ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?type=recovery` : 'http://localhost:8081/auth/callback?type=recovery')
        : Linking.createURL('auth/callback', { queryParams: { type: 'recovery' } });

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) return { error };
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  // Update password for authenticated user
  const updatePassword = useCallback(async (newPassword: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) return { error };
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  // Check username availability
  const checkUsernameAvailable = useCallback(async (username: string): Promise<{ available: boolean; message: string }> => {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters.' };
    }

    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername);

      if (user?.id) {
        query = query.neq('id', user.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        return { available: false, message: 'Error checking username.' };
      }

      const isAvailable = !data;
      return {
        available: isAvailable,
        message: isAvailable ? 'Username is available' : 'This username is already taken',
      };
    } catch {
      return { available: true, message: 'Username format accepted' };
    }
  }, [user]);

  // Save/Update Profile
  const saveProfile = useCallback(async (
    fullName: string,
    mobileNumber: string,
    countryCode: string = '+91',
    username?: string,
    avatarUrl?: string
  ): Promise<{ error: Error | null }> => {
    try {
      const currentUser = session?.user;
      if (!currentUser) {
        return { error: new Error('User is not authenticated. Please log in.') };
      }

      const trimmedName = fullName.trim();
      const cleanedMobile = mobileNumber.replace(/\D/g, '');
      const trimmedCode = countryCode.trim();
      const trimmedUsername = username?.trim().toLowerCase();

      const profilePayload: Record<string, any> = {
        id: currentUser.id,
        full_name: trimmedName,
        mobile_number: cleanedMobile,
        country_code: trimmedCode,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (trimmedUsername) profilePayload.username = trimmedUsername;
      if (avatarUrl !== undefined) profilePayload.avatar_url = avatarUrl;

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
          username: trimmedUsername,
          avatar_url: avatarUrl,
        },
      });

      setProfile(data as UserProfile);
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [session]);

  // Update notification and privacy preferences
  const updatePreferences = useCallback(async (
    notifications?: Partial<NotificationPreferences>,
    privacy?: Partial<PrivacySettings>
  ): Promise<{ error: Error | null }> => {
    try {
      if (!user) return { error: new Error('Not authenticated') };

      const mergedNotifications: NotificationPreferences = {
        email_alerts: true,
        push_notifications: true,
        chart_updates: true,
        ...(profile?.notification_preferences || {}),
        ...notifications,
      };

      const mergedPrivacy: PrivacySettings = {
        show_profile: false,
        activity_status: true,
        ...(profile?.privacy_settings || {}),
        ...privacy,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: mergedNotifications,
          privacy_settings: mergedPrivacy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) return { error: new Error(error.message) };

      setProfile(data as UserProfile);
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [user, profile]);

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

  // Delete user account
  const deleteAccount = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      if (!user) return { error: new Error('Not authenticated') };

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
      });

      if (!response.ok) {
        // Fallback to client side cleanup
        await supabase.from('profiles').delete().eq('id', user.id);
      }

      await signOut();
      return { error: null };
    } catch (err: any) {
      await signOut();
      return { error: null };
    }
  }, [user, session, signOut]);

  // Refresh Profile
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) return null;
    return await loadProfile(user.id);
  }, [user, loadProfile]);

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
      signUpWithPassword,
      signInWithPassword,
      resetPasswordForEmail,
      updatePassword,
      checkUsernameAvailable,
      saveProfile,
      updatePreferences,
      deleteAccount,
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
      signUpWithPassword,
      signInWithPassword,
      resetPasswordForEmail,
      updatePassword,
      checkUsernameAvailable,
      saveProfile,
      updatePreferences,
      deleteAccount,
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
