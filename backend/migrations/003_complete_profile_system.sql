-- Migration 003: Comprehensive User Profile, Preferences & Security Schema
-- Run in Supabase SQL Editor (https://supabase.com/dashboard/project/hmqnohcambgqxesewaac/sql/new)

-- ─── 1. Add New Profile Columns ────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"email_alerts": true, "push_notifications": true, "chart_updates": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB NOT NULL DEFAULT '{"show_profile": false, "activity_status": true}'::jsonb;

-- ─── 2. Case-Insensitive Unique Index for Usernames ───────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
  ON public.profiles (LOWER(username)) 
  WHERE username IS NOT NULL;

-- ─── 3. Username Format Constraint ─────────────────────────────────────────────
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_username_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_username_format
      CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,30}$');
  END IF;
END $$;

-- ─── 4. Updated Row Level Security Policies ───────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own full profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow public/authenticated to view public profiles if permitted by user privacy settings
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING ((privacy_settings->>'show_profile')::boolean = true);

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update only their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role full administrative access
DROP POLICY IF EXISTS "profiles_service_role" ON public.profiles;
CREATE POLICY "profiles_service_role"
  ON public.profiles FOR ALL
  TO service_role
  USING (true);
