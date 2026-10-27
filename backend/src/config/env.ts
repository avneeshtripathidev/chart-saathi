import 'dotenv/config';

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: (process.env.NODE_ENV as any) || 'production',
  SUPABASE_URL:
    process.env.SUPABASE_URL || 'https://hmqnohcambgqxesewaac.supabase.co',
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcW5vaGNhbWJncXhlc2V3YWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMDY5NDAsImV4cCI6MjEwODY4Mjk0MH0.MKmZslc_rUf9aWgXXQKUVA4D3UsMQ91eU5D66XgFdZY',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcW5vaGNhbWJncXhlc2V3YWFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzEwNjk0MCwiZXhwIjoyMTA4NjgyOTQwfQ.vykeBAyJVkuyOgH0aPw3Mw1E-knTOsPyl5-BwF2AYk8',
  RAILCORE_API_KEY: process.env.RAILCORE_API_KEY || '',
  RAILCORE_BASE_URL: process.env.RAILCORE_BASE_URL || 'https://ir.railcore.tech/v1',
  RAILCORE_TIMEOUT_MS: Number(process.env.RAILCORE_TIMEOUT_MS) || 10000,
  RAILCORE_MAX_RETRIES: Number(process.env.RAILCORE_MAX_RETRIES) || 2,
  RAILKIT_API_KEY:
    process.env.RAILKIT_API_KEY ||
    'irctc_a0eb2b1d4e955d8f58bd7daed07ca13b0b019002397c01ab',
  CHART_PROVIDER: ((process.env.CHART_PROVIDER as any) || 'railkit') as
    | 'mock'
    | 'railcore'
    | 'railkit',
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS) || 300,
  STALE_TTL_SECONDS: Number(process.env.STALE_TTL_SECONDS) || 900,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
};

export type Config = typeof config;
