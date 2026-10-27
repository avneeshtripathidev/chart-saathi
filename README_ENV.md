# 🔑 Master Environment Variables Guide (`.env`)

> Comprehensive reference for all environment configuration variables used across the **ChartSaathi** backend and mobile/web applications, including security rules, secret management, and copy-paste templates.

---

## 📑 Table of Contents
1. [Security Rules: Public vs Secret Keys](#1-security-rules-public-vs-secret-keys)
2. [Backend Configuration (`backend/.env`)](#2-backend-configuration-backendenv)
3. [Mobile App Configuration (`mobile/.env`)](#3-mobile-app-configuration-mobileenv)
4. [Production Secrets Setup by Platform](#4-production-secrets-setup-by-platform)
   - [Vercel (Backend API)](#a-vercel-backend-api-secrets)
   - [EAS / Expo (Mobile Bundles)](#b-eas--expo-mobile-secrets)
   - [Vercel / Netlify (Web Frontend)](#c-vercel--netlify-web-frontend)
5. [Environment Variables Matrix (Dev vs Production)](#5-environment-variables-matrix)
6. [Zod Runtime Validation (Backend)](#6-zod-runtime-validation-backend)
7. [Ready-to-Use Copy-Paste Templates](#7-ready-to-use-copy-paste-templates)

---

## 1. Security Rules: Public vs Secret Keys

Before configuring environment files, understand the distinction between public and secret keys:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC (SAFE FOR CLIENT)                        │
│                                                                        │
│ • SUPABASE_URL                                                         │
│ • SUPABASE_ANON_KEY (Public anonymous key protected by Postgres RLS)   │
│ • EXPO_PUBLIC_API_URL (Backend REST endpoint)                          │
│                                                                        │
│  Can be placed in mobile/.env and bundled into client JS / apps.      │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        SECRET (SERVER-SIDE ONLY)                       │
│                                                                        │
│ • SUPABASE_SERVICE_ROLE_KEY (Bypasses all Row Level Security!)         │
│ • RAILKIT_API_KEY / RAILCORE_API_KEY (Paid API credentials)            │
│                                                                        │
│  ⚠️ NEVER put these in mobile/.env, client bundles, or public git!     │
│  MUST ONLY reside in backend/.env or hosting platform secrets.         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Configuration (`backend/.env`)

File location: [`c:\Users\avani\Desktop\rail\backend\.env`](file:///c:/Users/avani/Desktop/rail/backend/.env)

| Variable | Type | Default | Required? | Description |
|---|---|---|---|---|
| `PORT` | Number | `3000` | No | Port on which Fastify listens for incoming HTTP connections locally. |
| `NODE_ENV` | String | `development` | Yes | App runtime mode: `development`, `production`, or `test`. Controls pino logging format. |
| `SUPABASE_URL` | URL | `http://localhost:54321` | Yes | Your Supabase project URL (`https://<project-id>.supabase.co`). |
| `SUPABASE_ANON_KEY` | String | — | Yes | Supabase public anonymous API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | String | — | Yes | Supabase secret admin key used to manage and verify user tokens. |
| `CHART_PROVIDER` | String | `mock` | Yes | Which chart provider to use: `mock` (demo data), `railkit`, or `railcore`. |
| `RAILKIT_API_KEY` | String | — | Optional | API key for RailKit provider (`irctc_...`) for live chart vacancy lookups. |
| `RAILCORE_API_KEY` | String | — | Optional | API key for RailCore provider. |
| `RAILCORE_BASE_URL` | URL | `https://ir.railcore.tech/v1` | No | Base API URL for RailCore services. |
| `RAILCORE_TIMEOUT_MS` | Number | `10000` | No | Maximum time in milliseconds before timing out provider requests. |
| `RAILCORE_MAX_RETRIES` | Number | `2` | No | Number of retries on network failures before reporting provider error. |
| `CACHE_TTL_SECONDS` | Number | `300` | No | Cache expiration time (5 minutes) for vacancy queries. |
| `STALE_TTL_SECONDS` | Number | `900` | No | Stale cache tolerance (15 minutes) served if upstream provider is down. |
| `RATE_LIMIT_MAX` | Number | `100` | No | Maximum requests permitted per IP per rate-limit window. |
| `RATE_LIMIT_WINDOW_MS` | Number | `60000` | No | Rate limit time window in milliseconds (1 minute). |
| `CORS_ORIGINS` | String | `http://localhost:8081` | Yes | Comma-separated allowed frontend origins for Cross-Origin Resource Sharing. |

---

## 3. Mobile App Configuration (`mobile/.env`)

File location: [`c:\Users\avani\Desktop\rail\mobile\.env`](file:///c:/Users/avani/Desktop/rail/mobile/.env)

In Expo SDK 50+, only variables prefixed with **`EXPO_PUBLIC_`** are bundled into the client app:

| Variable | Type | Default | Required? | Description |
|---|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL | `http://localhost:54321` | Yes | Your Supabase project URL (`https://<project-id>.supabase.co`). |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | String | — | Yes | Your Supabase **public anon key**. Safe for client distribution. |
| `EXPO_PUBLIC_API_URL` | URL | `http://localhost:3000` | Yes | Base URL of your running ChartSaathi backend API. |

---

## 4. Production Secrets Setup by Platform

### A. Vercel (Backend API Secrets)
In your Vercel Dashboard > **Project Settings** > **Environment Variables**, add:

```ini
NODE_ENV=production
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
CHART_PROVIDER=railkit
RAILKIT_API_KEY=<your-railkit-api-key>
CORS_ORIGINS=https://chartsaathi.com,https://app.chartsaathi.com,https://your-project.vercel.app
CACHE_TTL_SECONDS=300
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### B. EAS / Expo (Mobile Secrets)
For standalone iOS & Android builds using Expo Application Services (EAS):

```bash
# Set Supabase URL
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://<your-project-id>.supabase.co"

# Set Supabase Public Anon Key
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<your-production-anon-key>"

# Set Deployed Backend API URL
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://chartsaathi-backend.vercel.app"
```

### C. Vercel / Netlify (Web Frontend)
If hosting the exported Expo Web bundle (`mobile/dist`) on Vercel:
Add to Environment Variables:
```ini
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
EXPO_PUBLIC_API_URL=https://chartsaathi-backend.vercel.app
```

---

## 5. Environment Variables Matrix

| Variable | Local Development | Staging / Preview | Production |
|---|---|---|---|
| `NODE_ENV` | `development` | `production` | `production` |
| `PORT` | `3000` | Ignored (Serverless) | Ignored (Serverless) |
| `CHART_PROVIDER` | `mock` or `railkit` | `railkit` | `railkit` |
| `SUPABASE_URL` | `http://localhost:54321` or Supabase Dev | `https://staging.supabase.co` | `https://prod.supabase.co` |
| `CORS_ORIGINS` | `http://localhost:8081` | `https://preview-*.vercel.app` | `https://chartsaathi.com` |
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000` | `https://api-staging.vercel.app` | `https://api.chartsaathi.com` |

---

## 6. Zod Runtime Validation (Backend)

The backend guards its configuration at startup using Zod in [`backend/src/config/env.ts`](file:///c:/Users/avani/Desktop/rail/backend/src/config/env.ts).

If any required variable is missing or invalid (e.g. invalid URL or bad port number):
```text
❌ Invalid environment configuration:
{
  SUPABASE_URL: [ 'Invalid url' ],
  PORT: [ 'Expected number, received nan' ]
}
```
The server will immediately fail-fast and exit before accepting incoming traffic, preventing security loopholes and silent runtime failures.

---

## 7. Ready-to-Use Copy-Paste Templates

### Template A: `backend/.env`
```ini
# Server
PORT=3000
NODE_ENV=development

# Supabase Credentials (from Supabase Dashboard > Settings > API)
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Chart Provider (options: "mock", "railkit", "railcore")
CHART_PROVIDER=railkit
RAILKIT_API_KEY=irctc_a0eb2b1d4e955d8f58bd7daed07ca13b0b019002397c01ab

# Optional: RailCore API
RAILCORE_API_KEY=
RAILCORE_BASE_URL=https://ir.railcore.tech/v1
RAILCORE_TIMEOUT_MS=10000
RAILCORE_MAX_RETRIES=2

# Performance & Security
CACHE_TTL_SECONDS=300
STALE_TTL_SECONDS=900
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# CORS Allowed Origins (Comma-separated)
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

### Template B: `mobile/.env`
```ini
# Supabase Client Configuration
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Backend API Endpoint
# - For Local Web & iOS Simulator: http://localhost:3000
# - For Android Emulator: http://10.0.2.2:3000
# - For Physical Device on Wi-Fi: http://<your-computer-local-ip>:3000
# - For Production: https://<your-backend-subdomain>.vercel.app
EXPO_PUBLIC_API_URL=http://localhost:3000
```
