# 🚂 ChartSaathi (चार्ट साथी)

> **Indian Railway Chart Vacancy Explorer & Smart Berth Analytics**  
> Real-time vacancy charts, coach layouts, seat availability tracking, and secure authentication powered by Supabase.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-black.svg)](https://fastify.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0-000020.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB.svg)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Postgres-3ECF8E.svg)](https://supabase.com/)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Project Architecture](#project-architecture)
- [Authentication & Security Flow](#authentication--security-flow)
- [Environment Variables Guide](#environment-variables-guide)
- [Database Setup & Migrations](#database-setup--migrations)
- [Local Development Setup](#local-development-setup)
- [Automated Testing & Quality Checks](#automated-testing--quality-checks)
- [Production Deployment Guide](#production-deployment-guide)
  - [Backend Deployment (Docker / Cloud VM / Render)](#backend-deployment)
  - [Frontend Deployment (Expo Web / EAS Mobile)](#frontend-deployment)
- [OAuth & Supabase Dashboard Configuration](#oauth--supabase-dashboard-configuration)
- [API Reference](#api-reference)
- [Project Directory Structure](#project-directory-structure)

---

## 🔍 Overview

**ChartSaathi** is an informational companion for Indian Railways passengers. It checks vacant berths in reservation charts once initial charts are published (typically 4 hours before departure) and second charts (30–45 minutes prior).

### Key Features
- **Live Vacancy Exploration**: Search trains by number/name, view coach-by-coach layout and vacant berths.
- **Visual Berth Map**: Lower, Middle, Upper, Side Lower, Side Upper, and Cabin layouts.
- **Secure Authentication**:
  - **Continue with Google** (Official OAuth 2.0 via Supabase).
  - **Continue with Email** (Passwordless 6-digit OTP verification).
  - **Mandatory Profile Completion**: Full Name and Mobile Number with country calling code (default `+91` India) enforced before accessing main dashboard.
- **Strict Row Level Security (RLS)**: User profiles are isolated and guarded by PostgreSQL RLS policies.

---

## 🏛 Project Architecture

```text
rail/
├── backend/                  # Fastify REST API service
│   ├── migrations/           # PostgreSQL / Supabase SQL migrations
│   ├── src/
│   │   ├── config/           # Environment validation (Zod)
│   │   ├── db/               # Supabase admin client & in-memory cache
│   │   ├── providers/        # Chart providers (mock, railcore, railkit)
│   │   ├── routes/           # Fastify routes (/auth, /trains, /charts, /pnr, /stations)
│   │   └── index.ts          # Main Fastify server entry
│   └── tests/                # Jest unit & integration tests
│
└── mobile/                   # Expo Router Cross-Platform Client (iOS, Android, Web)
    ├── app/                  # File-based routing (Expo Router)
    │   ├── _layout.tsx       # Root layout with AuthGuard & theme
    │   ├── index.tsx         # Main Search & Vacancy Dashboard
    │   ├── login.tsx         # Google & Email OTP Sign-In
    │   ├── verify-email.tsx  # 6-Digit OTP verification & countdown
    │   ├── complete-profile.tsx # Mandatory profile registration
    │   ├── auth/callback.tsx # OAuth callback handler
    │   ├── results.tsx       # Vacancy search results
    │   ├── coaches.tsx       # Coach explorer
    │   ├── berths.tsx        # Berth layout map
    │   └── settings.tsx      # User account & app preferences
    ├── src/
    │   ├── context/          # React Context (AuthContext)
    │   ├── lib/              # Supabase client (AsyncStorage persistence)
    │   ├── utils/            # Theme, validation, and config tokens
    │   └── types/            # TypeScript interfaces
    └── tests/                # Jest unit tests for auth validation & theme
```

---

## 🔐 Authentication & Security Flow

```text
                                  START
                                    │
                                    ▼
                         Login / Signup Screen (/login)
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       Continue with Google (OAuth)         Continue with Email
                    │                               │
                    ▼                               ▼
         Google Consent Screen             Send 6-Digit Email OTP
                    │                               │
                    ▼                               ▼
         OAuth Callback (/auth/callback)     Verify OTP (/verify-email)
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                             Valid Session?
                                    │
                                    ▼
                            Load User Profile
                                    │
                                    ▼
                      Full Name & Mobile Complete?
                                  /   \
                                No     Yes
                                │       │
                                ▼       ▼
         Complete Profile (/complete-profile)  Dashboard (/)
                                │
                                ▼
                       Validate & Save Profile
                                │
                                ▼
                            Dashboard (/)
```

### Route Guard Enforcement (`AuthGuard`)
1. **Unauthenticated Access**: Any attempt to load protected pages redirects to `/login`.
2. **Incomplete Profiles**: Logged-in accounts missing either full name or mobile number are redirected to `/complete-profile`.
3. **Completed Sessions**: Authenticated users visiting `/login`, `/verify-email`, or `/complete-profile` are forwarded directly to `/`.

---

## ⚙️ Environment Variables Guide

### 1. Backend Environment (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `3000` | Port on which Fastify listens. |
| `NODE_ENV` | String | `development` | Environment mode (`development`, `production`, `test`). |
| `SUPABASE_URL` | URL | `http://localhost:54321` | Supabase project URL (`https://xyz.supabase.co`). |
| `SUPABASE_ANON_KEY` | String | — | Supabase public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | String | — | Supabase private service-role key (**never expose to frontend**). |
| `CHART_PROVIDER` | String | `mock` | Vacancy provider: `mock`, `railkit`, or `railcore`. |
| `RAILKIT_API_KEY` | String | — | Optional API key for RailKit provider. |
| `RAILCORE_API_KEY` | String | — | Optional API key for RailCore provider. |
| `RAILCORE_BASE_URL` | URL | `https://ir.railcore.tech/v1` | RailCore API base endpoint. |
| `CACHE_TTL_SECONDS` | Number | `300` | Query cache TTL in seconds. |
| `RATE_LIMIT_MAX` | Number | `100` | Maximum requests per rate-limit window. |
| `RATE_LIMIT_WINDOW_MS` | Number | `60000` | Rate-limit window in milliseconds (1 minute). |
| `CORS_ORIGINS` | String | `http://localhost:8081` | Comma-separated allowed CORS origins. |

### 2. Mobile App Environment (`mobile/.env`)

Copy `mobile/.env.example` to `mobile/.env`:

| Variable | Type | Default | Description |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL | `http://localhost:54321` | Supabase API endpoint. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | String | — | Supabase anon key (safe for client bundles). |
| `EXPO_PUBLIC_API_URL` | URL | `http://localhost:3000` | ChartSaathi backend API URL. |

> **Security Note:** Never add `SUPABASE_SERVICE_ROLE_KEY` to the `mobile` project.

---

## 🗄 Database Setup & Migrations

The database runs on PostgreSQL via Supabase. Migrations are located in [`backend/migrations/`](file:///c:/Users/avani/Desktop/rail/backend/migrations/).

### Execution Steps
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** > **New Query**.
3. Run the schema migrations in numerical order:
   - **`001_initial_schema.sql`**: Trains, stations, chart snapshots, coach snapshots, berth snapshots, search events.
   - **`002_create_profiles.sql`**: User profiles with Row Level Security (RLS) and auto `updated_at` trigger.

### Profiles Schema (`public.profiles`)
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  mobile_number  TEXT NOT NULL,
  country_code   TEXT NOT NULL DEFAULT '+91',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### RLS Policies
- Authenticated users can only `SELECT`, `INSERT`, and `UPDATE` rows where `auth.uid() = id`.
- Service role has full administrative access for backend processes.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v20 or later (`node -v`)
- **npm**: v10 or later (`npm -v`)
- **Git**

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <repo-url>
cd rail

# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install --legacy-peer-deps
```

### 2. Configure Environment Files

```bash
# In backend/
cp .env.example .env
# Edit backend/.env with your Supabase credentials

# In mobile/
cp .env.example .env
# Edit mobile/.env with your Supabase URL & Anon Key
```

### 3. Run the Backend Server

```bash
cd backend
npm run dev
```
The server will start on [http://localhost:3000](http://localhost:3000) with watch mode (`tsx watch`).  
Verify by visiting [http://localhost:3000/health](http://localhost:3000/health).

### 4. Run the Mobile / Web Client

In a separate terminal:
```bash
cd mobile
npm start
```

- Press **`w`** in the terminal to open the web version in your browser ([http://localhost:8081](http://localhost:8081)).
- Scan the QR code with **Expo Go** on Android or iOS.
- Press **`a`** for Android Emulator or **`i`** for iOS Simulator.

---

## ✅ Automated Testing & Quality Checks

Run the following test commands to ensure all checks pass:

### Backend Checks
```bash
cd backend

# Run Jest unit & integration tests (24 tests)
npm test

# Run TypeScript typecheck
npm run typecheck

# Run Production build
npm run build
```

### Mobile Checks
```bash
cd mobile

# Run Jest unit tests (25 tests covering auth, phone validation, theme tokens, API client)
npm test

# Run TypeScript typecheck
npm run typecheck
```

---

## 🌐 OAuth & Supabase Dashboard Configuration

### 1. Enable Google OAuth
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project and configure the **OAuth consent screen**.
3. Under **Credentials** > **Create Credentials** > **OAuth Client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs:
     `https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/auth/v1/callback`
4. Copy your **Client ID** and **Client Secret**.
5. In Supabase Dashboard:
   - Navigate to **Authentication** > **Providers** > **Google**.
   - Enable the provider, paste your Client ID and Client Secret, then click **Save**.

### 2. Configure Email OTP
1. In Supabase Dashboard, go to **Authentication** > **Providers** > **Email**.
2. Turn **Enable Email provider** **ON**.
3. Under **Authentication** > **Email Templates** > **Magic Link / Confirmation**:
   - Ensure the email body contains `{{ .Token }}` so recipients receive a 6-digit verification code.
4. Under **Authentication** > **URL Configuration**:
   - **Site URL**: `http://localhost:8081` (or your production web domain).
   - **Redirect URLs**:
     - `http://localhost:8081/auth/callback`
     - `chartsaathi://auth/callback`

---

## 🚢 Production Deployment Guide

### Backend Deployment

The backend is a standard Node.js Fastify application.

#### Option A: Docker Container
Create a `Dockerfile` in `backend/`:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
docker build -t chartsaathi-backend .
docker run -p 3000:3000 --env-file .env chartsaathi-backend
```

#### Option B: Deploy to Render / Railway / Fly.io
1. Connect your GitHub repository.
2. Root directory: `backend`.
3. Build command: `npm install && npm run build`.
4. Start command: `node dist/index.js`.
5. Add production environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT=3000`, etc.).

#### Option C: Deploy to Vercel (Serverless Functions)
The backend is pre-configured for Vercel with [`backend/vercel.json`](file:///c:/Users/avani/Desktop/rail/backend/vercel.json) and [`backend/api/index.ts`](file:///c:/Users/avani/Desktop/rail/backend/api/index.ts):
1. In Vercel, click **New Project** and import your Git repository.
2. Set **Root Directory** to `backend`.
3. Framework Preset: **Other**.
4. Build Command: `npm run build` (Output Directory: leave blank).
5. Add Environment Variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CHART_PROVIDER`, `RAILKIT_API_KEY`, etc.).
6. Click **Deploy**. Vercel will create a serverless endpoint handling all Fastify routes.

---

### Frontend Deployment

#### Option A: Web Deployment (Vercel / Netlify / Cloudflare Pages)
1. In `mobile/`:
   ```bash
   npx expo export -p web
   ```
2. The static bundle will be exported to `mobile/dist`.
3. Deploy `mobile/dist` to Vercel, Netlify, or any static hosting platform.
4. Set build command: `npx expo export -p web`, output directory: `dist`.

#### Option B: Native Mobile App (EAS Build)
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure build: `eas build:configure`
4. Build for Android (APK / AAB):
   ```bash
   eas build --platform android --profile preview
   ```
5. Build for iOS (IPA / TestFlight):
   ```bash
   eas build --platform ios --profile preview
   ```

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Server status and provider info | No |
| `GET` | `/api/v1/auth/profile` | Retrieve authenticated user's profile | Bearer Token |
| `POST` | `/api/v1/auth/profile` | Update user's name & mobile number | Bearer Token |
| `GET` | `/api/v1/trains/search` | Search trains by number/name query | No |
| `GET` | `/api/v1/charts/vacancy` | Fetch vacant berths & coach stats | No |
| `GET` | `/api/v1/pnr/:pnr` | Retrieve booking status for 10-digit PNR | No |
| `GET` | `/api/v1/stations/search`| Search railway stations by code/name | No |

---

## 📄 License & Disclaimer

- **License**: MIT
- **Disclaimer**: ChartSaathi is an independent informational utility and is **NOT** affiliated with, authorized, or endorsed by Indian Railways, IRCTC, CRIS, or the Government of India. This application does not process ticket bookings or seat allocations. All vacancy data is derived from official reservation charts prepared prior to train departure.
