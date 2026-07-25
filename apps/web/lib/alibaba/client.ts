import { createHmac } from "node:crypto";

/**
 * Direct client for the Alibaba.com Open Platform GOP gateway, ported from
 * the removed NestJS backend. SERVER-ONLY — it signs requests with the app
 * secret and carries the access token, neither of which may ever reach the
 * browser. Import only from Server Components / route handlers.
 */
const BASE_URL = process.env.ALIBABA_API_BASE_URL ?? "https://openapi-api.alibaba.com/rest";
const APP_KEY = process.env.ALIBABA_APP_KEY ?? "";
const APP_SECRET = process.env.ALIBABA_APP_SECRET ?? "";

// The access token is valid for ~18 months and injected via env. If it ever
// expires, a refresh token exchange can be added here; for now a clear error
// beats a silent empty catalog.
let accessToken = process.env.ALIBABA_ACCESS_TOKEN ?? "";

export const ALIBABA_PATHS = {
  BUYER_PRODUCT_SEARCH: "/eco/buyer/product/search",
  BUYER_PRODUCT_DESCRIPTION: "/eco/buyer/product/description",
} as const;

export class AlibabaError extends Error {}

/** sign = UPPER(hex(HMAC-SHA256(secret, apiPath + concat(sortedKey+value…)))). */
function sign(apiPath: string, params: Record<string, string>): string {
  const base = apiPath + Object.keys(params).sort().map((k) => `${k}${params[k]}`).join("");
  return createHmac("sha256", APP_SECRET).update(base, "utf8").digest("hex").toUpperCase();
}

/** Calls a GET-only buyer API path with automatic signing + access token. */
export async function callAlibaba<T = unknown>(
  apiPath: string,
  biz: Record<string, string | number>,
  options: { revalidate?: number } = {},
): Promise<T> {
  if (!APP_KEY || !APP_SECRET) throw new AlibabaError("Alibaba app credentials are not configured");
  if (!accessToken) throw new AlibabaError("Alibaba access token is not configured");

  const params: Record<string, string> = {
    app_key: APP_KEY,
    timestamp: Date.now().toString(),
    sign_method: "sha256",
    access_token: accessToken,
    ...Object.fromEntries(Object.entries(biz).map(([k, v]) => [k, String(v)])),
  };
  params.sign = sign(apiPath, params);

  const res = await fetch(`${BASE_URL}${apiPath}?${new URLSearchParams(params)}`, {
    // Cacheable per keyword when a revalidate window is given (home rails);
    // otherwise always fresh (interactive search / PDP).
    ...(options.revalidate !== undefined ? { next: { revalidate: options.revalidate } } : { cache: "no-store" }),
  });
  if (!res.ok) throw new AlibabaError(`Alibaba HTTP ${res.status} for ${apiPath}`);

  const data = (await res.json()) as { type?: string; code?: string; message?: string } & T;
  // GOP surfaces business errors as { type, code, message } with no data payload.
  if (data.type && data.code && data.message && data.code !== "0") {
    throw new AlibabaError(`Alibaba ${data.code}: ${data.message}`);
  }
  return data as T;
}

/** Overrides the in-memory access token (e.g. after a manual refresh). */
export function setAccessToken(token: string): void {
  accessToken = token;
}
