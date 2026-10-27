# ⚡ 2. Supabase Setup & Configuration Guide (ChartSaathi)

> Complete step-by-step guide for creating, migrating, configuring, and securing your **Supabase** database and authentication service for ChartSaathi.

---

## 📑 Table of Contents
1. [Create a Supabase Project](#1-create-a-supabase-project)
2. [Obtaining API Keys & Connection Strings](#2-obtaining-api-keys--connection-strings)
3. [Running Database Migrations](#3-running-database-migrations)
   - [Migration 001: Initial Railway Schema](#step-31-migration-001---initial-schema)
   - [Migration 002: Profiles Table & Row Level Security](#step-32-migration-002---profiles-table--rls)
4. [Configuring Authentication](#4-configuring-authentication)
   - [A. Email 6-Digit OTP Setup](#a-email-6-digit-otp-setup)
   - [B. Google OAuth 2.0 Setup](#b-google-oauth-20-setup)
   - [C. Redirect URLs Configuration](#c-redirect-urls-configuration)
5. [Row Level Security (RLS) Verification](#5-row-level-security-rls-verification)
6. [SMTP / Custom Email Delivery for Production](#6-smtp--custom-email-delivery-for-production)
7. [Common Issues & Troubleshooting](#7-common-issues--troubleshooting)

---

## 1. Create a Supabase Project

1. Go to **[supabase.com](https://supabase.com/)** and sign in or create an account.
2. In the dashboard, click **"New Project"**.
3. Fill in the project details:
   - **Name**: `chartsaathi` (or any preferred name)
   - **Database Password**: Set a strong password and save it securely.
   - **Region**: Select a region close to your target users (e.g., `South Asia (Mumbai)` for India).
   - **Pricing Plan**: Free tier is sufficient for development.
4. Click **"Create new project"** and wait 1–2 minutes for the database cluster to initialize.

---

## 2. Obtaining API Keys & Connection Strings

Once your project is ready:
1. Navigate to **Project Settings** (gear icon in the bottom-left sidebar) > **API**.
2. Locate the following credentials:

| Credential | Where to find | Where to use | Security Level |
|---|---|---|---|
| **Project URL** | `Project URL` field (`https://<project-id>.supabase.co`) | `backend/.env` & `mobile/.env` | Public |
| **anon / public key** | `Project API keys` > `anon` `public` | `backend/.env` & `mobile/.env` | Safe for client browsers / mobile apps |
| **service_role key** | `Project API keys` > `service_role` `secret` | `backend/.env` **ONLY** | ⚠️ **SUPER SECRET! Never put this in `mobile/.env` or client bundles** |

---

## 3. Running Database Migrations

You can apply the SQL migrations directly in the Supabase web dashboard.

### Step 3.1: Migration 001 - Initial Schema
1. In the Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **"New Query"**.
3. Copy the full contents of [`backend/migrations/001_initial_schema.sql`](file:///c:/Users/avani/Desktop/rail/backend/migrations/001_initial_schema.sql).
4. Paste it into the SQL Editor and click **"Run"** (or press `Ctrl + Enter`).
5. **Tables created**:
   - `trains` (Train numbers, names, source/destination stations)
   - `stations` (Railway station codes and names)
   - `chart_snapshots` (Chart preparation status, timestamps, expires)
   - `coach_snapshots` (Coach IDs, classes, berth totals, vacancy counts)
   - `berth_snapshots` (Individual berth numbers, types, occupancy status)
   - `search_events` (Anonymous search analytics)

### Step 3.2: Migration 002 - Profiles Table & RLS
1. In the **SQL Editor**, click **"New Query"**.
2. Copy the full contents of [`backend/migrations/002_create_profiles.sql`](file:///c:/Users/avani/Desktop/rail/backend/migrations/002_create_profiles.sql):

```sql
-- Migration 002: Create User Profiles table with RLS for ChartSaathi
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

-- Automatic updated_at timestamp trigger
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

-- Enable Row Level Security (RLS)
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
```
3. Paste into the editor and click **"Run"**.

---

## 4. Configuring Authentication

### A. Email 6-Digit OTP Setup
1. In the Supabase Dashboard, navigate to **Authentication** > **Providers** > **Email**.
2. Ensure **Enable Email provider** is toggled to **ON**.
3. Ensure **Confirm email** is toggled to **ON**.
4. Set **OTP expiry limit** to `600` seconds (10 minutes) or your desired duration.
5. In the left sidebar, navigate to **Authentication** > **Email Templates** > **Confirm signup**:
   - **Subject**: `Your Email Verification Code`
   - **Body (HTML)**: Replace the default confirmation link with `{{ .Token }}`:
     ```html
     <h2>Verify Your ChartSaathi Account</h2>
     <p>Thank you for signing up with ChartSaathi! Please enter the 6-digit verification code below in the app to verify your email address:</p>
     <div style="background-color: #242227; border: 1px solid #36333C; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
       <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E45F60; font-family: 'Courier New', monospace;">{{ .Token }}</span>
     </div>
     <p style="color: #888888; font-size: 13px;">This verification code will expire in 10 minutes. Do not share this code with anyone.</p>
     <p style="color: #888888; font-size: 13px;">If you did not initiate this signup, please disregard this email.</p>
     ```
   - Click **Save**.

6. *(Optional)* If using passwordless email sign-in, navigate to **Authentication** > **Email Templates** > **Magic Link**:
   - **Subject**: `Your ChartSaathi Login Code`
   - **Body (HTML)**: Ensure `{{ .Token }}` is displayed for the 6-digit code.
   - Click **Save**.

### B. Google OAuth 2.0 Setup
1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Select your Google Cloud project (or create one).
3. In the sidebar, navigate to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External** > Click **Create**.
   - App Name: `ChartSaathi`
   - User Support Email: Your email
   - Developer Contact Email: Your email
   - Click **Save and Continue** through the steps.
4. Go to **APIs & Services** > **Credentials**:
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `ChartSaathi Supabase Auth`.
   - Under **Authorized redirect URIs**, click **+ ADD URI** and paste:
     ```text
     https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/auth/v1/callback
     ```
   - Click **Create**.
   - Copy the generated **Client ID** and **Client Secret**.
5. Back in **Supabase Dashboard**:
   - Go to **Authentication** > **Providers** > **Google**.
   - Toggle **Enable Sign in with Google** to **ON**.
   - Paste your **Client ID** and **Client Secret**.
   - Click **Save**.

### C. Redirect URLs Configuration
1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**:
   - **Site URL**: `http://localhost:8081` (for local development) or `https://your-domain.com`.
   - **Redirect URLs** (Add each URL on a new line):
     ```text
     http://localhost:8081/auth/callback
     http://localhost:19006/auth/callback
     chartsaathi://auth/callback
     https://your-production-app.vercel.app/auth/callback
     ```
2. Click **Save**.

---

## 5. Row Level Security (RLS) Verification

To verify that all tables are properly protected:
1. In the Supabase Dashboard, go to **Table Editor**.
2. Select `profiles`:
   - You should see an **"RLS Enabled"** badge next to the table name.
3. In **SQL Editor**, test querying with an anonymous user:
   ```sql
   -- This query should return 0 rows for unauthenticated access
   SELECT * FROM public.profiles;
   ```
   Users will only be able to view and modify their own record where `auth.uid() = id`.

---

## 6. SMTP / Custom Email Delivery for Production

> **Important:** Supabase's default email service has a strict rate limit of **3 emails per hour**. For production, configure a custom SMTP provider (such as Resend, SendGrid, or Amazon SES).

1. In Supabase Dashboard, go to **Project Settings** > **Authentication** > **SMTP Settings**.
2. Toggle **Enable Custom SMTP** to **ON**.
3. Example using **[Resend](https://resend.com/)**:
   - **Sender email**: `auth@yourdomain.com`
   - **Sender name**: `ChartSaathi`
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (or `587`)
   - **Username**: `resend`
   - **Password**: `<your-resend-api-key>`
4. Click **Save**.

---

## 7. Common Issues & Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `401 Unauthorized` on `/api/v1/auth/profile` | Missing or invalid Bearer token | Pass `Authorization: Bearer <session.access_token>`. |
| `RLS Policy Violation on profiles insert` | Client tried to insert a profile with an `id` different from `auth.uid()` | Ensure `id: session.user.id` is used when saving profiles. |
| `Google redirect_uri_mismatch` | Google Cloud Console does not have the exact Supabase callback URL | Add `https://<project-id>.supabase.co/auth/v1/callback` to Authorized Redirect URIs in Google Cloud Console. |
| `Email rate limit exceeded` | Default Supabase SMTP limit reached | Set up custom SMTP (Resend/SendGrid) in Project Settings > Authentication. |
