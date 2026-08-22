/**
 * Order persistence.
 *
 * Checkout cannot be secure without a server-side record: the amount a gateway
 * confirms has to be checked against an amount the browser never controlled.
 * The app has no database, so the store is a small pluggable interface with
 * two drivers:
 *
 *   - `upstash` — Upstash Redis over its REST API. Plain `fetch`, no driver
 *     dependency, and it survives the per-request isolation of serverless
 *     functions. Used automatically when the env vars are present.
 *   - `memory`  — a module-level Map. Fine for `next dev`, and it is what you
 *     get on Vercel without Redis configured, where each lambda gets its own
 *     copy: orders will appear to vanish between requests. Guarded below.
 *
 * A Postgres/Prisma driver (blueprint §5) slots in behind the same interface.
 */
import { randomBytes } from "node:crypto";
import type { Order } from "./types";

const TTL_SECONDS = 60 * 60 * 24 * 7; // orders stay queryable for a week

export interface OrderStore {
  put(order: Order): Promise<void>;
  get(id: string): Promise<Order | null>;
  /** Maps a gateway reference back to an order id (callbacks carry the reference). */
  indexReference(reference: string, orderId: string): Promise<void>;
  resolveReference(reference: string): Promise<string | null>;
  /**
   * Returns true exactly once per key, ever. Concurrent or replayed gateway
   * callbacks use this so a payment is only ever applied a single time.
   */
  claimOnce(key: string): Promise<boolean>;
}

// ─────────────────────────── memory driver ───────────────────────────

const mem = new Map<string, string>();
const claims = new Set<string>();

const memoryStore: OrderStore = {
  async put(order) {
    mem.set(`order:${order.id}`, JSON.stringify(order));
  },
  async get(id) {
    const raw = mem.get(`order:${id}`);
    return raw ? (JSON.parse(raw) as Order) : null;
  },
  async indexReference(reference, orderId) {
    mem.set(`ref:${reference}`, orderId);
  },
  async resolveReference(reference) {
    return mem.get(`ref:${reference}`) ?? null;
  },
  async claimOnce(key) {
    if (claims.has(key)) return false;
    claims.add(key);
    return true;
  },
};

// ─────────────────────────── upstash driver ───────────────────────────

function upstashDriver(url: string, token: string): OrderStore {
  async function command<T>(args: (string | number)[]): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Order store unavailable (Redis HTTP ${res.status})`);
    const body = (await res.json()) as { result?: T; error?: string };
    if (body.error) throw new Error(`Order store error: ${body.error}`);
    return body.result as T;
  }

  return {
    async put(order) {
      await command(["SET", `order:${order.id}`, JSON.stringify(order), "EX", TTL_SECONDS]);
    },
    async get(id) {
      const raw = await command<string | null>(["GET", `order:${id}`]);
      return raw ? (JSON.parse(raw) as Order) : null;
    },
    async indexReference(reference, orderId) {
      await command(["SET", `ref:${reference}`, orderId, "EX", TTL_SECONDS]);
    },
    async resolveReference(reference) {
      return command<string | null>(["GET", `ref:${reference}`]);
    },
    async claimOnce(key) {
      const result = await command<string | null>(["SET", `claim:${key}`, "1", "NX", "EX", TTL_SECONDS]);
      return result === "OK";
    },
  };
}

// ─────────────────────────── selection ───────────────────────────

let warned = false;

export function orderStore(): OrderStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return upstashDriver(url, token);

  if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    // Not fatal — a preview deploy should still boot — but every serverless
    // instance keeps its own Map, so orders will not survive the redirect to
    // the gateway and back.
    console.warn(
      "[orders] UPSTASH_REDIS_REST_URL/TOKEN are unset; falling back to per-instance memory. " +
        "Configure Redis before taking real payments.",
    );
  }
  return memoryStore;
}

/** True when orders persist across requests — checkout refuses to start otherwise. */
export function orderStoreIsDurable(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Order ids double as the eSewa `transaction_uuid` prefix, so they are limited
 * to characters eSewa accepts (alphanumerics and hyphens).
 */
export function newOrderId(): string {
  return `AH-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
