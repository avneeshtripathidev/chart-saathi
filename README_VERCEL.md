# ▲ 3. Vercel Backend Deployment Guide (ChartSaathi)

> Complete step-by-step guide for deploying the **ChartSaathi** Fastify backend as high-performance Serverless Functions on **Vercel**.

---

## 📑 Table of Contents
1. [Overview & How Fastify Runs on Vercel](#1-overview--how-fastify-runs-on-vercel)
2. [Pre-Configured Architecture Files](#2-pre-configured-architecture-files)
3. [Deploying via Vercel Web Dashboard (Recommended)](#3-deploying-via-vercel-web-dashboard-recommended)
4. [Deploying via Vercel CLI](#4-deploying-via-vercel-cli)
5. [Required Production Environment Variables](#5-required-production-environment-variables)
6. [Post-Deployment Verification & Smoke Tests](#6-post-deployment-verification--smoke-tests)
7. [Connecting Your Frontend (Expo / Mobile / Web)](#7-connecting-your-frontend)
8. [Custom Domains & HTTPS Setup](#8-custom-domains--https-setup)
9. [Common Issues & Troubleshooting](#9-common-issues--troubleshooting)

---

## 1. Overview & How Fastify Runs on Vercel

Fastify is traditionally a standalone HTTP server that listens on a port (e.g., `app.listen({ port: 3000 })`).  
On Vercel, Node.js applications run inside **Serverless Functions** where requests are passed directly into an event handler.

ChartSaathi uses Fastify's official serverless adaptation pattern:
- The app builds once and caches its instance across function invocations.
- `app.server.emit('request', req, res)` dispatches incoming Vercel requests directly to Fastify router without port binding collisions.
- Standalone execution (`npm run dev`) continues to work locally on [http://localhost:3000](http://localhost:3000).

---

## 2. Pre-Configured Architecture Files

Your project already includes the required serverless files inside the [`backend/`](file:///c:/Users/avani/Desktop/rail/backend/) directory:

### 1. `backend/api/index.ts` (Serverless Function Entry)
```ts
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../src/index.js';

let appPromise: ReturnType<typeof buildApp> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  const app = await appPromise;
  app.server.emit('request', req, res);
}
```

### 2. `backend/vercel.json` (Catch-All Rewrite Rule)
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index" }
  ]
}
```

### 3. `backend/src/index.ts` (Environment Guard)
```ts
export { buildApp };

// Only listen on a port when running standalone locally (not inside Vercel serverless)
if (!process.env.VERCEL) {
  start();
}
```

---

## 3. Deploying via Vercel Web Dashboard (Recommended)

1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to **[vercel.com/new](https://vercel.com/new)** and sign in.
3. Import your Git repository.
4. In the **Configure Project** screen:
   - **Project Name**: `chartsaathi-backend` (or your choice).
   - **Root Directory**: Click `Edit` and select **`backend`** (⚠️ **Crucial step**).
   - **Framework Preset**: Select **`Other`**.
   - **Build Command**: `npm run build` (leave default).
   - **Output Directory**: Leave empty / default.
   - **Install Command**: `npm install` (leave default).
5. Expand the **Environment Variables** section and add the required variables (see [Section 5](#5-required-production-environment-variables)).
6. Click **"Deploy"**.
7. Wait 30–60 seconds. Once completed, Vercel will provide your live URL:
   `https://<your-project-name>.vercel.app`

---

## 4. Deploying via Vercel CLI

If you prefer deploying directly from your local terminal:

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Navigate to the backend directory:
   ```bash
   cd c:\Users\avani\Desktop\rail\backend
   ```

3. Log in to Vercel:
   ```bash
   vercel login
   ```

4. Deploy to preview:
   ```bash
   vercel
   ```

5. Deploy directly to production:
   ```bash
   vercel --prod
   ```

When prompted:
- **Set up and deploy?**: `y`
- **Which scope?**: Select your account
- **Link to existing project?**: `n` (first time)
- **What's your project's name?**: `chartsaathi-backend`
- **In which directory is your code located?**: `./`

---

## 5. Required Production Environment Variables

Add these in **Vercel Dashboard** > **Project Settings** > **Environment Variables**:

| Variable | Recommended Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations & structured logging. |
| `SUPABASE_URL` | `https://<your-project>.supabase.co` | Your live Supabase endpoint. |
| `SUPABASE_ANON_KEY` | `<your-production-anon-key>` | Public anon key for auth checks. |
| `SUPABASE_SERVICE_ROLE_KEY` | `<your-service-role-key>` | Backend service role key for administrative tasks. |
| `CHART_PROVIDER` | `railkit` *(or `mock` / `railcore`)* | Vacancy provider module. |
| `RAILKIT_API_KEY` | `<your-railkit-api-key>` | API key for railway chart notices. |
| `CORS_ORIGINS` | `https://your-frontend-app.vercel.app,http://localhost:8081` | Allowed web domains (comma-separated). |
| `CACHE_TTL_SECONDS` | `300` | In-memory cache validity (5 minutes). |
| `RATE_LIMIT_MAX` | `100` | Max requests per rate-limit window per IP. |
| `RATE_LIMIT_WINDOW_MS`| `60000` | Rate-limit window in milliseconds (1 minute). |

---

## 6. Post-Deployment Verification & Smoke Tests

Verify that your live Vercel backend is responding properly using `curl` or your browser:

### 1. Test Health Endpoint
```bash
curl -f https://<your-project-name>.vercel.app/health
```
**Expected Response (`200 OK`)**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "provider": "railkit",
  "isDemo": false,
  "timestamp": "2026-10-27T19:50:00.000Z"
}
```

### 2. Test Train Search API
```bash
curl -f "https://<your-project-name>.vercel.app/api/v1/trains/search?query=12951"
```
**Expected Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "trainNumber": "12951",
      "trainName": "NDLS TEJAS RAJ",
      "runningDays": ["M", "T", "W", "T", "F", "S", "S"]
    }
  ],
  "source": "railkit"
}
```

### 3. Test Protected Auth Route Rejection
```bash
curl -i https://<your-project-name>.vercel.app/api/v1/auth/profile
```
**Expected Response (`401 Unauthorized`)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization header"
  }
}
```

---

## 7. Connecting Your Frontend

Once your backend is live on Vercel:

1. Update [`mobile/.env`](file:///c:/Users/avani/Desktop/rail/mobile/.env):
   ```ini
   EXPO_PUBLIC_API_URL=https://<your-project-name>.vercel.app
   ```
2. If deploying the mobile/web frontend on Vercel as well, set `EXPO_PUBLIC_API_URL` in the frontend project's Vercel Environment Variables.
3. Update `CORS_ORIGINS` in your backend Vercel settings to include your frontend URL:
   ```text
   CORS_ORIGINS=https://<your-frontend-project>.vercel.app
   ```

---

## 8. Custom Domains & HTTPS Setup

1. In Vercel, go to **Settings** > **Domains**.
2. Add your custom domain or subdomain (e.g., `api.chartsaathi.com`).
3. Add the required DNS records at your domain registrar:
   - **Type**: `CNAME`
   - **Name**: `api`
   - **Value**: `cname.vercel-dns.com`
4. Vercel automatically generates and renews a free **Let's Encrypt SSL/TLS Certificate**.

---

## 9. Common Issues & Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `404 NOT_FOUND: Route not found` | Missing catch-all rewrite rule | Ensure [`backend/vercel.json`](file:///c:/Users/avani/Desktop/rail/backend/vercel.json) contains `"rewrites": [{ "source": "/(.*)", "destination": "/api/index" }]`. |
| `CORS Error in Browser` | Frontend domain not in `CORS_ORIGINS` | Add your frontend domain to `CORS_ORIGINS` in Vercel backend Environment Variables. |
| `Function Timeout (10s limit on free tier)` | Provider API call took too long | Set `RAILCORE_TIMEOUT_MS=8000` or upgrade to Vercel Pro for longer execution timeouts. |
| `Build Error: File is not under rootDir` | `api/` directory accidentally included in `tsc` | Verify that [`backend/tsconfig.json`](file:///c:/Users/avani/Desktop/rail/backend/tsconfig.json) excludes `"api"`. |
| `Cold Starts` | First request after inactivity takes ~1s | Normal for serverless architecture. Pre-warmed Fastify app minimizes cold start overhead to under 350ms. |
