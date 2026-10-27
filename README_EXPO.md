# 📱 1. Expo & Mobile App Setup Guide (ChartSaathi)

> Complete step-by-step guide for setting up, running, testing, and deploying the **ChartSaathi** Expo Router mobile and web application.

---

## 📑 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Project Setup & Installation](#2-project-setup--installation)
3. [Environment Configuration (`mobile/.env`)](#3-environment-configuration)
4. [Running the Application Locally](#4-running-the-application-locally)
   - [Web Mode](#a-running-on-web-recommended-for-quick-testing)
   - [Physical Device (Expo Go)](#b-running-on-physical-device-expo-go)
   - [Android Emulator](#c-running-on-android-emulator)
   - [iOS Simulator](#d-running-on-ios-simulator-macos-only)
5. [Authentication & Screen Navigation Flow](#5-authentication--screen-navigation-flow)
6. [Testing & Quality Verification](#6-testing--quality-verification)
7. [Building for Production](#7-building-for-production)
   - [Exporting Web Bundle (Vercel / Netlify / Cloudflare)](#a-exporting-web-bundle)
   - [Building Android APK / AAB (EAS Build)](#b-building-android-apk--aab-via-eas)
   - [Building iOS App (EAS Build)](#c-building-ios-app-via-eas)
8. [Common Issues & Troubleshooting](#8-common-issues--troubleshooting)

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js**: v20.x or v22.x LTS ([Download](https://nodejs.org/))
- **npm**: v10.x or later
- **Git** ([Download](https://git-scm.com/))
- *(Optional for mobile testing)*: **Expo Go** app installed from Google Play Store or Apple App Store.

---

## 2. Project Setup & Installation

Open your terminal (PowerShell or Bash) and navigate to the `mobile` directory:

```bash
cd c:\Users\avani\Desktop\rail\mobile
```

Install dependencies using the `--legacy-peer-deps` flag to ensure compatibility with React 19 and Expo SDK 53:

```bash
npm install --legacy-peer-deps
```

Verify that the TypeScript types compile cleanly:
```bash
npm run typecheck
```

---

## 3. Environment Configuration

1. In the `mobile` directory, create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

2. Open [`mobile/.env`](file:///c:/Users/avani/Desktop/rail/mobile/.env) and populate the values:
```ini
# Supabase Configuration (Use public anon key only — NEVER use service role key here)
EXPO_PUBLIC_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# ChartSaathi Backend API (Local or deployed URL)
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> **Note:** Any variable accessed in client code in Expo must start with `EXPO_PUBLIC_`.

---

## 4. Running the Application Locally

Start the Expo development server:

```bash
cd mobile
npm start
```

This starts the Metro bundler and opens the Expo interactive terminal menu.

### A. Running on Web (Recommended for quick testing)
- Press **`w`** in the terminal running `npm start`.
- The browser will open automatically at [http://localhost:8081](http://localhost:8081).
- The web preview includes a realistic mobile device frame with responsive scaling.

### B. Running on Physical Device (Expo Go)
1. Ensure your computer and phone are connected to the **same Wi-Fi network**.
2. Open the **Expo Go** app on your phone:
   - **Android**: Tap "Scan QR Code" and scan the terminal QR code.
   - **iOS**: Open the native Camera app, point at the terminal QR code, and tap the Expo prompt.

### C. Running on Android Emulator
1. Start your Android Studio Virtual Device (AVD).
2. Press **`a`** in the terminal running Expo.

### D. Running on iOS Simulator (macOS only)
1. Open Xcode Simulator.
2. Press **`i`** in the terminal running Expo.

---

## 5. Authentication & Screen Navigation Flow

The app includes automatic route guarding (`AuthGuard`) located in [`mobile/app/_layout.tsx`](file:///c:/Users/avani/Desktop/rail/mobile/app/_layout.tsx):

```text
/login (Sign In / Register)
   │
   ├── [Continue with Google] ──► Google Consent ──► /auth/callback
   │
   └── [Continue with Email] ──► /verify-email (6-Digit OTP + Countdown)
                                      │
                                      ▼
                      Is Profile Complete (Name & Phone)?
                                     / \
                                   No   Yes
                                   │     │
                                   ▼     ▼
                        /complete-profile  / (Main Dashboard)
```

### Screens Included:
- **[`app/login.tsx`](file:///c:/Users/avani/Desktop/rail/mobile/app/login.tsx)**: Google OAuth & 6-digit Email OTP entry.
- **[`app/verify-email.tsx`](file:///c:/Users/avani/Desktop/rail/mobile/app/verify-email.tsx)**: 6-digit OTP code verification with 60-second cooldown timer, resend button, and change email option.
- **[`app/complete-profile.tsx`](file:///c:/Users/avani/Desktop/rail/mobile/app/complete-profile.tsx)**: Mandatory Full Name and Mobile Number with Country Code selector modal (defaulting to India `+91`).
- **[`app/auth/callback.tsx`](file:///c:/Users/avani/Desktop/rail/mobile/app/auth/callback.tsx)**: Handles OAuth redirect and forwards to dashboard or profile setup.
- **[`app/index.tsx`](file:///c:/Users/avani/Desktop/rail/mobile/app/index.tsx)**: Main Railway Vacancy Search, live popular inquiries, and recent searches.
- **[`app/settings.tsx`](file:///c:/Users/avani/Desktop/rail/mobile/app/settings.tsx)**: Displays authenticated User Profile, verified email badge, mobile number, and Sign Out action.

---

## 6. Testing & Quality Verification

Run the test suite inside the `mobile` directory:

```bash
cd mobile

# Run all 25 unit tests (Auth validation, theme tokens, API client)
npm test

# Run TypeScript type check
npm run typecheck
```

---

## 7. Building for Production

### A. Exporting Web Bundle
To deploy the web version to **Vercel**, **Cloudflare Pages**, or **Netlify**:

```bash
cd mobile
npx expo export -p web
```

- Output directory: `mobile/dist`
- Deploy `mobile/dist` as a static site.

### B. Building Android APK / AAB via EAS
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Initialize build configuration:
   ```bash
   eas build:configure
   ```
4. Build a standalone Android APK (for testing):
   ```bash
   eas build --platform android --profile preview
   ```
5. Build an Android App Bundle (AAB for Google Play Store):
   ```bash
   eas build --platform android --profile production
   ```

### C. Building iOS App via EAS
```bash
eas build --platform ios --profile production
```

---

## 8. Common Issues & Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `ERESOLVE could not resolve dependency` | React 19 peer dependency conflict with jest preset | Always run `npm install --legacy-peer-deps`. |
| `Cannot connect to Metro bundler` | Phone and PC on different Wi-Fi networks | Connect to the same network, or run `npx expo start --tunnel`. |
| `Network request failed` | Backend URL pointing to `localhost` from a physical phone | In `mobile/.env`, change `EXPO_PUBLIC_API_URL` to your computer's local IP (e.g. `http://192.168.1.100:3000`) or your deployed Vercel backend URL. |
| `Redirect URL mismatch on Google OAuth` | Supabase redirect URL not added to Google Cloud Console | Add `https://<your-project>.supabase.co/auth/v1/callback` in Google Cloud Console Credentials. |
