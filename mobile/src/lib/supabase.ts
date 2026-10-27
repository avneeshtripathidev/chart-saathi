import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hmqnohcambgqxesewaac.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export interface NotificationPreferences {
  email_alerts: boolean;
  push_notifications: boolean;
  chart_updates: boolean;
}

export interface PrivacySettings {
  show_profile: boolean;
  activity_status: boolean;
}

export interface UserProfile {
  id: string;
  full_name: string;
  username?: string | null;
  mobile_number: string;
  country_code: string;
  avatar_url?: string | null;
  onboarding_completed?: boolean;
  phone_verified?: boolean;
  notification_preferences?: NotificationPreferences;
  privacy_settings?: PrivacySettings;
  created_at?: string;
  updated_at?: string;
}
