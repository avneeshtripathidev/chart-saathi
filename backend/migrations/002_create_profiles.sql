-- Migration 002: Create User Profiles table with RLS for ChartSaathi
-- Run via Supabase Dashboard SQL Editor or Supabase CLI

-- ─── Profiles Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  mobile_number  TEXT NOT NULL,
  country_code   TEXT NOT NULL DEFAULT '+91',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & lookups
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON public.profiles(created_at);

-- ─── Automatic updated_at timestamp trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ─── Row Level Security (RLS) ──────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Users can insert their own profile with their own uid
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Users can update only their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Service role has full access (backend administrative tasks)
DROP POLICY IF EXISTS "profiles_service_role" ON public.profiles;
CREATE POLICY "profiles_service_role"
  ON public.profiles FOR ALL
  TO service_role
  USING (true);
