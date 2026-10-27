import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url().default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().default('in-memory-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('in-memory-service-role-key'),
  RAILCORE_API_KEY: z.string().optional(),
  RAILCORE_BASE_URL: z.string().url().default('https://ir.railcore.tech/v1'),
  RAILCORE_TIMEOUT_MS: z.coerce.number().default(10000),
  RAILCORE_MAX_RETRIES: z.coerce.number().default(2),
  RAILKIT_API_KEY: z.string().optional(),
  CHART_PROVIDER: z.enum(['mock', 'railcore', 'railkit']).default('mock'),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  STALE_TTL_SECONDS: z.coerce.number().default(900),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  CORS_ORIGINS: z.string().default('http://localhost:8081,http://localhost:19006'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
