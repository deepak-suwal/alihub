import { z } from "zod";

/** An optional URL env var — an unset/empty value is treated as absent rather than a validation error. */
function optionalUrl() {
  return z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());
}

/**
 * Single source of truth for every environment variable the platform reads.
 * Fails fast at boot (see loadEnv) instead of surfacing as an undefined
 * deep inside a payment or Alibaba signing call.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // --- Core infra ---
  DATABASE_URL: z.string().url(),
  SHADOW_DATABASE_URL: optionalUrl(),
  REDIS_URL: z.string().url(),

  // --- Auth ---
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  // --- Alibaba Open Platform ---
  ALIBABA_APP_KEY: z.string(),
  ALIBABA_APP_SECRET: z.string(),
  ALIBABA_GGS_ISV_APP_KEY: z.string().optional(),
  ALIBABA_GGS_ISV_APP_SECRET: z.string().optional(),
  // GOP gateway (openapi.alibaba.com platform) — signing is always HMAC-SHA256
  ALIBABA_API_BASE_URL: z.string().url().default("https://openapi-api.alibaba.com/rest"),
  // Must match the callback URL registered in the App Console character-for-character
  // (e.g. a trycloudflare tunnel to /alibaba/oauth/callback during dev).
  ALIBABA_OAUTH_REDIRECT_URI: optionalUrl(),
  ALIBABA_RATE_LIMIT_PER_SECOND: z.coerce.number().int().positive().default(5),
  // Optional micro-cache for live catalog reads. Default 0 = fully real
  // time (every request is a live Alibaba call). Raise it (e.g. 60) if
  // traffic starts hitting the per-AppKey QPS ceiling.
  ALIBABA_LIVE_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(0),

  // --- Payments: ConnectIPS ---
  // NOTE: ConnectIPS signs its merchant request token using an RSA keypair
  // issued as a PKCS12 (.pfx) certificate by the settlement bank, not a
  // shared HMAC secret — confirm the exact field set against the current
  // ConnectIPS Merchant Integration Guide before go-live (see
  // apps/api/src/payments/providers/connectips/connectips.signer.ts).
  CONNECTIPS_MERCHANT_ID: z.string().optional(),
  CONNECTIPS_APP_ID: z.string().optional(),
  CONNECTIPS_APP_NAME: z.string().optional(),
  CONNECTIPS_PFX_PATH: z.string().optional(),
  CONNECTIPS_PFX_PASSPHRASE: z.string().optional(),
  CONNECTIPS_BASE_URL: z.string().url().default("https://uat.connectips.com"),
  CONNECTIPS_MODE: z.enum(["uat", "production"]).default("uat"),

  // --- Payments: Fonepay ---
  FONEPAY_MERCHANT_CODE: z.string().optional(),
  FONEPAY_USERNAME: z.string().optional(),
  FONEPAY_PASSWORD: z.string().optional(),
  FONEPAY_SECRET_KEY: z.string().optional(),
  FONEPAY_BASE_URL: z.string().url().default("https://dev-clientapi.fonepay.com"),
  FONEPAY_MODE: z.enum(["uat", "production"]).default("uat"),

  // --- Storage ---
  S3_BUCKET: z.string().default("alihub-assets"),
  S3_REGION: z.string().default("ap-south-1"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: optionalUrl(),

  // --- Third-party ---
  FX_RATE_PROVIDER_API_KEY: z.string().optional(),
  FX_RATE_PROVIDER_URL: optionalUrl(),
  SMS_PROVIDER_API_KEY: z.string().optional(),
  SENTRY_DSN: optionalUrl(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
