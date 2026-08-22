/** Provider lookup. Adding ConnectIPS or Fonepay means adding a file and a row here. */
import type { ProviderCode } from "../orders/types";
import { esewaProvider } from "./esewa";
import { khaltiProvider } from "./khalti";
import type { PaymentProvider } from "./types";

const PROVIDERS: Record<ProviderCode, PaymentProvider> = {
  esewa: esewaProvider,
  khalti: khaltiProvider,
};

export function getProvider(code: string): PaymentProvider | null {
  return PROVIDERS[code as ProviderCode] ?? null;
}

/** Providers whose credentials are present — the only ones offered at checkout. */
export function availableProviders(): { code: ProviderCode; label: string }[] {
  return Object.values(PROVIDERS)
    .filter((p) => p.isConfigured())
    .map((p) => ({ code: p.code, label: p.label }));
}
