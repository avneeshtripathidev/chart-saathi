# 🌐 Google Cloud OAuth 2.0 Setup Guide for ChartSaathi

> Step-by-step visual and actionable guide to setting up **"Continue with Google"** authentication in Google Cloud Console and linking it with Supabase for ChartSaathi.

---

## 📑 Table of Contents
1. [Overview & Authentication Flow](#1-overview--authentication-flow)
2. [Step 1: Create a Google Cloud Project](#step-1-create-a-google-cloud-project)
3. [Step 2: Configure the OAuth Consent Screen](#step-2-configure-the-oauth-consent-screen)
4. [Step 3: Create OAuth 2.0 Client Credentials](#step-3-create-oauth-20-client-credentials)
5. [Step 4: Enable Google Provider in Supabase](#step-4-enable-google-provider-in-supabase)
6. [Step 5: Configure Redirect Whitelist in Supabase](#step-5-configure-redirect-whitelist-in-supabase)
7. [Step 6: Testing the Google Sign-In Flow](#step-6-testing-the-google-sign-in-flow)
8. [Step 7: Publishing from Testing to Production](#step-7-publishing-from-testing-to-production)
9. [Troubleshooting Common Google OAuth Errors](#troubleshooting-common-google-oauth-errors)

---

## 1. Overview & Authentication Flow

ChartSaathi uses Supabase Auth's official Google OAuth 2.0 integration:

```text
User clicks "Continue with Google"
                │
                ▼
  Supabase redirects to Google Accounts
                │
                ▼
  User consents & picks Google Account
                │
                ▼
  Google redirects to Supabase Auth Callback
  (https://<project-id>.supabase.co/auth/v1/callback)
                │
                ▼
  Supabase validates token & establishes Session
                │
                ▼
  Client redirects to /auth/callback
                │
                ▼
  Checks Profile: Name & Mobile Number present?
       /                      \
     No                        Yes
     │                          │
     ▼                          ▼
  /complete-profile          / (Dashboard)
```

---

## Step 1: Create a Google Cloud Project

1. Open your browser and go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Sign in with your Google account.
3. At the top of the page, click the **Project Dropdown** (next to the "Google Cloud" logo).
4. Click **"NEW PROJECT"** in the top-right corner of the modal.
5. Enter project details:
   - **Project Name**: `ChartSaathi` (or any name you prefer)
   - **Organization**: Leave as *No organization* (or select your organization).
6. Click **"CREATE"** and wait a few seconds.
7. Click the notification bell or the project dropdown to select your new project.

---

## Step 2: Configure the OAuth Consent Screen

Before creating OAuth credentials, you must define the user-facing consent screen:

1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**  
   *(Or search "OAuth consent screen" in the top search bar)*.
2. Select **User Type**:
   - Choose **External** (allows any Google account to sign in).
   - Click **"CREATE"**.
3. **App Information**:
   - **App name**: `ChartSaathi`
   - **User support email**: Select your email address.
   - **App logo**: *(Optional)* Upload an icon if desired.
4. **App Domain**:
   - **Application home page**: *(Optional for local testing)* e.g. `https://chartsaathi.com`
   - **Application privacy policy link**: *(Optional for testing)*
5. **Developer Contact Information**:
   - **Email addresses**: Enter your contact email address.
6. Click **"SAVE AND CONTINUE"**.
7. **Scopes**:
   - Click **"ADD OR REMOVE SCOPES"**.
   - Select the standard non-sensitive scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **"UPDATE"**, then click **"SAVE AND CONTINUE"**.
8. **Test Users** *(While in "Testing" mode)*:
   - Click **"+ ADD USERS"**.
   - Add your own Google email address (and any team members who will test the login).
   - Click **"SAVE AND CONTINUE"**.
9. Review the summary and click **"BACK TO DASHBOARD"**.

---

## Step 3: Create OAuth 2.0 Client Credentials

1. In the left sidebar, navigate to **APIs & Services** > **Credentials**.
2. At the top of the page, click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**.
3. Fill in the credential details:
   - **Application type**: Select **Web application** (⚠️ Even for mobile, Supabase Auth handles OAuth as a web application).
   - **Name**: `ChartSaathi Supabase Client`
4. **Authorized JavaScript origins**:
   - Click **"+ ADD URI"** and add:
     - `https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co`
     - `http://localhost:8081` *(for local web testing)*
5. **Authorized redirect URIs** (⚠️ **Most critical step**):
   - Click **"+ ADD URI"** and enter your Supabase project callback URL:
     ```text
     https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/auth/v1/callback
     ```
   *(Replace `<YOUR-SUPABASE-PROJECT-ID>` with your real Supabase project reference from your Supabase Dashboard URL)*.
6. Click **"CREATE"**.
7. A dialog will appear with:
   - **Client ID** (e.g. `1234567890-abcdefg.apps.googleusercontent.com`)
   - **Client Secret** (e.g. `GOCSPX-xxxxxxxxxxxxxxxxxxxx`)
8. **Copy both values** to your clipboard or keep the tab open.

---

## Step 4: Enable Google Provider in Supabase

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Select your `chartsaathi` project.
3. In the left sidebar, click on **Authentication** > **Providers**.
4. Scroll down and locate **Google**.
5. Click on **Google** to expand its configuration:
   - Toggle **"Enable Sign in with Google"** to **ON**.
   - Paste your **Client ID** (from Step 3).
   - Paste your **Client Secret** (from Step 3).
6. Click **"Save"** at the bottom of the card.

---

## Step 5: Configure Redirect Whitelist in Supabase

Supabase needs to know where to redirect users back after Google authenticates them:

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**.
2. **Site URL**:
   - For local development: `http://localhost:8081`
   - For production: `https://your-domain.com` (or your Vercel web URL)
3. **Redirect URLs**:
   Click **"Add URL"** and add each of the following:
   ```text
   http://localhost:8081/auth/callback
   http://localhost:19006/auth/callback
   chartsaathi://auth/callback
   https://<your-frontend-project>.vercel.app/auth/callback
   ```
4. Click **"Save"**.

---

## Step 6: Testing the Google Sign-In Flow

1. Start your backend and mobile app locally:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Mobile
   cd mobile
   npm start
   ```
2. Press **`w`** in the mobile terminal to open in your browser (`http://localhost:8081`).
3. You will automatically land on `/login`.
4. Click **"Continue with Google"**.
5. You will be redirected to the Google account chooser screen.
6. Select your Google account and grant permissions.
7. Google redirects to Supabase, which completes the OAuth session and returns to `/auth/callback`.
8. Because a new Google user does not have a registered mobile number yet, the app automatically navigates to **`/complete-profile`**.
9. Enter your **Full Name** and **Mobile Number** (+91), then tap **"Complete Registration"**.
10. You will land directly on the **ChartSaathi Search Dashboard (`/`)**!
11. Navigate to **Settings** (`/settings`) to confirm your Google account name, verified email, and phone number are displayed.

---

## Step 7: Publishing from Testing to Production

While in **Testing** mode in Google Cloud Console, only emails added to your "Test Users" list can sign in. When you are ready for public users:

1. In **Google Cloud Console**, go to **APIs & Services** > **OAuth consent screen**.
2. Under **Publishing status**, click **"PUBLISH APP"**.
3. Confirm the prompt.
4. Your application is now in **Production** mode, allowing any user with a Google account to sign in without restriction.

---

## Troubleshooting Common Google OAuth Errors

### 1. `Error 400: redirect_uri_mismatch`
- **Cause**: The redirect URI passed in the request does not match the Authorized Redirect URIs in Google Cloud Console.
- **Fix**: Check Google Cloud Console > **Credentials** > your OAuth Client. Make sure:
  `https://<your-project-id>.supabase.co/auth/v1/callback` is listed **exactly** (no trailing slash, matching HTTPS).

### 2. `Access blocked: ChartSaathi has not completed the Google verification process`
- **Cause**: The app is in "Testing" mode and the email you tried to sign in with is not on the Test Users list.
- **Fix**: Either add the email to **Test Users** under **OAuth consent screen** > **Test Users**, or click **"Publish App"**.

### 3. `OAuth callback URL not allowed in Supabase`
- **Cause**: The client redirect destination is not whitelisted.
- **Fix**: In Supabase Dashboard > **Authentication** > **URL Configuration**, add `http://localhost:8081/auth/callback` to the **Redirect URLs** list.

### 4. `Mobile deep link doesn't return to app (standalone build)`
- **Cause**: The custom URL scheme is not registered in `app.json`.
- **Fix**: Ensure [`mobile/app.json`](file:///c:/Users/avani/Desktop/rail/mobile/app.json) has:
  ```json
  {
    "expo": {
      "scheme": "chartsaathi"
    }
  }
  ```
