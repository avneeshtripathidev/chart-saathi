# 🚀 ChartSaathi Production Deployment & Verification Checklist

This document provides step-by-step instructions for deploying both the backend API and the mobile/web frontend, configuring production secrets, setting up database migrations, and executing post-deployment verification checks.

---

## 📋 Pre-Deployment Checklist

- [ ] Supabase production project created.
- [ ] SQL migrations `001_initial_schema.sql` and `002_create_profiles.sql` applied.
- [ ] Row Level Security (RLS) enabled on all tables.
- [ ] Google Cloud OAuth credentials created and authorized for Supabase callback.
- [ ] Email provider (custom SMTP / Resend or Supabase Auth) configured with `{{ .Token }}` OTP template.
- [ ] Domain names and SSL certificates active.
- [ ] Environment variables defined on hosting platforms (never committed to git).

---

## 1. Database & Supabase Deployment

### Step 1.1: Run SQL Migrations
In the [Supabase Dashboard](https://supabase.com/dashboard) > **SQL Editor**:
1. Run [`backend/migrations/001_initial_schema.sql`](file:///c:/Users/avani/Desktop/rail/backend/migrations/001_initial_schema.sql).
2. Run [`backend/migrations/002_create_profiles.sql`](file:///c:/Users/avani/Desktop/rail/backend/migrations/002_create_profiles.sql).

### Step 1.2: Verify Row Level Security (RLS)
Execute this query to confirm RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```
`rowsecurity` should be `true` for `profiles`, `trains`, `stations`, `chart_snapshots`, `coach_snapshots`, `berth_snapshots`, and `search_events`.

---

## 2. Backend Deployment

### Option A: Docker Deployment (Recommended)

1. Build the production Docker container:
```bash
docker build -t chartsaathi-backend:latest ./backend
```

2. Run the container with production environment variables:
```bash
docker run -d \
  --name chartsaathi-api \
  -p 3000:3000 \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e SUPABASE_URL="https://<your-project>.supabase.co" \
  -e SUPABASE_ANON_KEY="<production-anon-key>" \
  -e SUPABASE_SERVICE_ROLE_KEY="<production-service-role-key>" \
  -e CHART_PROVIDER="railkit" \
  -e RAILKIT_API_KEY="<your-railkit-api-key>" \
  -e CORS_ORIGINS="https://chartsaathi.com,https://app.chartsaathi.com" \
  chartsaathi-backend:latest
```

### Option B: Cloud Platform (Render / Railway / Fly.io / AWS ECS)

1. **Repository**: Point to repository root.
2. **Root Directory**: `backend`.
3. **Build Command**: `npm install && npm run build`.
4. **Start Command**: `node dist/index.js`.
5. **Port**: `3000`.
6. **Environment Variables**:
   ```ini
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_ANON_KEY=<production-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
   CHART_PROVIDER=railkit
   RAILKIT_API_KEY=<your-railkit-api-key>
   CORS_ORIGINS=https://your-domain.com
   CACHE_TTL_SECONDS=300
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW_MS=60000
   ```

### Option C: Deploy Backend to Vercel (Serverless Functions)

ChartSaathi is pre-configured for Vercel serverless deployment with [`backend/vercel.json`](file:///c:/Users/avani/Desktop/rail/backend/vercel.json) and [`backend/api/index.ts`](file:///c:/Users/avani/Desktop/rail/backend/api/index.ts).

1. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select your Git repository.
   - Set **Root Directory** to `backend`.
   - **Framework Preset**: `Other`.
2. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave blank (default).
   - **Install Command**: `npm install`
3. **Environment Variables** in Vercel Project Settings:
   - `SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `SUPABASE_ANON_KEY`: `<production-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<production-service-role-key>`
   - `CHART_PROVIDER`: `railkit` (or `mock` / `railcore`)
   - `RAILKIT_API_KEY`: `<your-railkit-api-key>`
   - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app`
4. **Deploy**:
   - Click **Deploy**. Vercel will build the Fastify serverless bundle and assign a URL (e.g. `https://chartsaathi-backend.vercel.app`).
   - Test by visiting `https://your-backend.vercel.app/health`.

---

## 3. Frontend Deployment (Web & Mobile)

### Option A: Progressive Web App (PWA) / Web Bundle
1. In `mobile/`:
   ```bash
   cd mobile
   npx expo export -p web
   ```
2. The compiled assets will be in `mobile/dist`.
3. Deploy to **Vercel**, **Cloudflare Pages**, or **Netlify**:
   - Framework preset: Other / Static.
   - Build command: `npx expo export -p web`.
   - Output directory: `dist`.
   - Add environment variables:
     ```ini
     EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
     EXPO_PUBLIC_API_URL=https://api.chartsaathi.com
     ```

### Option B: Native Mobile App via EAS Build
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to Expo:
   ```bash
   eas login
   ```
3. Set EAS secrets for production:
   ```bash
   eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://<your-project>.supabase.co"
   eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<production-anon-key>"
   eas secret:create --name EXPO_PUBLIC_API_URL --value "https://api.chartsaathi.com"
   ```
4. Build Android APK / App Bundle:
   ```bash
   eas build --platform android --profile production
   ```
5. Build iOS Archive (IPA):
   ```bash
   eas build --platform ios --profile production
   ```

---

## 4. Post-Deployment Verification & Smoke Tests

Run these checks against your deployed production backend:

### Check 1: Health Endpoint
```bash
curl -f https://<your-backend-domain>/health
```
**Expected response (`200 OK`)**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "provider": "railkit",
  "isDemo": false,
  "timestamp": "2026-10-27T19:00:00.000Z"
}
```

### Check 2: Unauthorized Profile Protection
```bash
curl -i https://<your-backend-domain>/api/v1/auth/profile
```
**Expected response (`401 Unauthorized`)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization header"
  }
}
```

### Check 3: Train Search Endpoint
```bash
curl -f "https://<your-backend-domain>/api/v1/trains/search?query=12951"
```
**Expected response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "trainNumber": "12951",
      "trainName": "NDLS TEJAS RAJ",
      "runningDays": ["M", "T", "W", "T", "F", "S", "S"]
    }
  ]
}
```

---

## 5. Security & Maintenance Best Practices

1. **Service Role Key Protection**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set ONLY on the backend server and never included in Expo/mobile environment variables.
2. **CORS Origins**: Limit `CORS_ORIGINS` in production to trusted domains (e.g., `https://chartsaathi.com`, not `*`).
3. **Database Backups**: Enable automated daily backups in your Supabase project settings.
4. **Rate Limiting**: The Fastify backend has built-in rate limiting (default 100 requests/minute per IP). Adjust `RATE_LIMIT_MAX` based on expected traffic.
5. **SMTP / Email Delivery**: Replace Supabase's default mailer with a verified custom SMTP service (e.g. Resend, SendGrid, Amazon SES) to prevent OTP delivery delays or spam folder flags.
