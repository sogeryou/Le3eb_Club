import { z } from 'zod';

const RawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  STAGING_MODE: z.enum(['true', 'false']).default('false'),
  STAGING_ACCESS_PASSWORD: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_ACCESS_TTL_SEC: z.coerce.number().default(900),
  JWT_REFRESH_TTL_SEC: z.coerce.number().default(2592000),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ALLOW_DEMO_SEED: z.enum(['true', 'false']).default('false'),
  CORS_ALLOWLIST: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(['sandbox', 'appstore', 'play', 'mixed']).default('sandbox'),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
  S3_PUBLIC_BASE_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SETTLEMENT_CRON_DISABLED: z.enum(['true', 'false']).default('false'),
  SETTLEMENT_TZ: z.string().default('Asia/Riyadh'),
  LOG_LEVEL: z.string().default('info'),
  STORAGE_BACKEND: z.enum(['json', 'postgres', 'auto']).default('auto'),
});

export type AppEnv = z.infer<typeof RawEnvSchema>;
let cached: AppEnv | null = null;

export function loadEnv(): AppEnv {
  if (cached) return cached;
  const parsed = RawEnvSchema.safeParse(process.env);
  if (!parsed.success) throw new Error(parsed.error.message);
  const env = parsed.data;
  if (env.NODE_ENV === 'production') {
    const missing: string[] = [];
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 64) missing.push('JWT_SECRET');
    if (!env.ADMIN_EMAIL) missing.push('ADMIN_EMAIL');
    if (!env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');
    if (env.ALLOW_DEMO_SEED === 'true') missing.push('ALLOW_DEMO_SEED=false');
    if (missing.length) throw new Error(`Missing production env: ${missing.join(', ')}`);
  }
  if (env.STAGING_MODE === 'true' && (env.NODE_ENV !== 'production' || !env.STAGING_ACCESS_PASSWORD || env.STAGING_ACCESS_PASSWORD.length < 24 || !env.REDIS_URL || env.ALLOW_DEMO_SEED !== 'false' || env.PAYMENT_PROVIDER !== 'sandbox' || env.SETTLEMENT_CRON_DISABLED !== 'true' || env.STORAGE_BACKEND !== 'json')) {
    throw new Error('Private staging requires production mode, staging password, isolated Redis/JSON, demo seed off, payments sandbox, settlement off');
  }
  cached = env;
  return env;
}

export function resolveJwtSecret(env: AppEnv): string {
  if (env.JWT_SECRET && env.JWT_SECRET.length >= 32) return env.JWT_SECRET;
  if (env.NODE_ENV === 'production') throw new Error('JWT_SECRET required');
  return 'dev-only-jwt-secret-change-me-in-env';
}
