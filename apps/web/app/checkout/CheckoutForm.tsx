"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/commerce/ProductImage";
import { AlertIcon, CartIcon, ShieldIcon } from "@/components/ui/icons";

interface QuoteLine {
  productId: string;
  title: string;
  imageUrl: string | null;
  qty: number;
  unitPriceNpr: number;
  totalNpr: number;
}
interface Quote {
  lines: QuoteLine[];
  subtotalNpr: number;
  vatNpr: number;
  totalNpr: number;
  rejected: { productId: string; reason: string }[];
}

type Instruction =
  | { kind: "form_post"; action: string; fields: Record<string, string> }
  | { kind: "redirect"; url: string };

const npr = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Hands the browser to the gateway. A redirect is a plain navigation; a
 * form POST needs a real submitted form, which is how eSewa accepts a
 * signed payment request.
 */
function handOff(instruction: Instruction) {
  if (instruction.kind === "redirect") {
    window.location.href = instruction.url;
    return;
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = instruction.action;
  for (const [name, value] of Object.entries(instruction.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function CheckoutForm({
  providers,
  durableStore,
}: {
  providers: { code: string; label: string }[];
  durableStore: boolean;
}) {
  const { items } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState(providers[0]?.code ?? "");

  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address: "", city: "", note: "" });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Quantities are what the quote depends on — re-price when they change.
  const cartKey = useMemo(
    () => items.map((i) => `${i.productId}:${i.qty}`).join("|"),
    [items],
  );

  const loadQuote = useCallback(async () => {
    if (items.length === 0) {
      setQuoting(false);
      return;
    }
    setQuoting(true);
    setQuoteError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, qty: i.qty })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not price your cart");
      setQuote(data as Quote);
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : "Could not price your cart");
    } finally {
      setQuoting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          customer: form,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
      // The cart is deliberately left intact until the order is confirmed paid
      // (cleared on the order page), so a failed payment can be retried.
      handOff(data.instruction as Instruction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CartIcon className="h-7 w-7" width={28} height={28} />}
        title="Your cart is empty"
        description="Add products to your cart before checking out."
        action={
          <Link href="/" className={buttonClasses("primary", "md")}>
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-900">Checkout</h1>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <h2 className="mb-4 text-base font-semibold text-ink-900">Delivery details</h2>

              <Field label="Full name" htmlFor="fullName">
                <Input id="fullName" value={form.fullName} onChange={set("fullName")} required maxLength={80} />
              </Field>

              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label="Mobile number" htmlFor="phone" hint="(98••••••••)">
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={set("phone")}
                    pattern="9[0-9]{9}"
                    placeholder="98XXXXXXXX"
                    required
                  />
                </Field>
                <Field label="Email" htmlFor="email" hint="(optional)">
                  <Input id="email" type="email" value={form.email} onChange={set("email")} />
                </Field>
              </div>

              <Field label="Delivery address" htmlFor="address">
                <Input id="address" value={form.address} onChange={set("address")} required maxLength={200} />
              </Field>

              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label="City" htmlFor="city">
                  <Input id="city" value={form.city} onChange={set("city")} required />
                </Field>
                <Field label="Note for the team" htmlFor="note" hint="(optional)">
                  <Input id="note" value={form.note} onChange={set("note")} maxLength={500} />
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-4 text-base font-semibold text-ink-900">Payment method</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {providers.map((p) => (
                  <label
                    key={p.code}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      provider === p.code
                        ? "border-brand-400 bg-brand-50"
                        : "border-ink-200 bg-white hover:border-ink-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={p.code}
                      checked={provider === p.code}
                      onChange={() => setProvider(p.code)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span className="text-sm font-semibold text-ink-900">{p.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs text-ink-500">
                <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                You pay on the gateway&apos;s own secure page. Alihub never sees your PIN, OTP or card details.
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardBody>
              <h2 className="mb-4 text-base font-semibold text-ink-900">Order summary</h2>

              {quoting ? (
                <p className="py-6 text-center text-sm text-ink-500">Fetching live prices…</p>
              ) : quoteError ? (
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
                  <p className="flex items-start gap-2">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {quoteError}
                  </p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => void loadQuote()}>
                    Try again
                  </Button>
                </div>
              ) : quote ? (
                <>
                  <ul className="space-y-3">
                    {quote.lines.map((line) => (
                      <li key={line.productId} className="flex gap-3">
                        <ProductImage
                          src={line.imageUrl}
                          alt={line.title}
                          className="h-12 w-12 shrink-0 rounded-lg border border-ink-100"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-medium text-ink-800">{line.title}</p>
                          <p className="mt-0.5 text-xs text-ink-400">
                            {line.qty} × रू {npr(line.unitPriceNpr)}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-ink-900">
                          रू {npr(line.totalNpr)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {quote.rejected.length > 0 ? (
                    <p className="mt-3 rounded-lg bg-ink-50 p-2.5 text-xs text-ink-500">
                      {quote.rejected.length} product{quote.rejected.length === 1 ? "" : "s"} could not be
                      priced and {quote.rejected.length === 1 ? "has" : "have"} been left out of this order.
                    </p>
                  ) : null}

                  <dl className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm">
                    <div className="flex justify-between text-ink-600">
                      <dt>Subtotal (landed)</dt>
                      <dd className="tabular-nums">रू {npr(quote.subtotalNpr)}</dd>
                    </div>
                    <div className="flex justify-between text-ink-600">
                      <dt>VAT 13%</dt>
                      <dd className="tabular-nums">रू {npr(quote.vatNpr)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-ink-900">
                      <dt>Total</dt>
                      <dd className="tabular-nums">रू {npr(quote.totalNpr)}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-ink-400">
                    Includes freight, customs duty and Alihub margin. Priced live from Alibaba just now.
                  </p>
                </>
              ) : null}

              {error ? (
                <p className="mt-4 flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              ) : null}

              {!durableStore ? (
                <p className="mt-4 rounded-lg bg-ink-50 p-2.5 text-xs text-ink-500">
                  Development mode: orders are kept in memory only.
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="mt-5 w-full"
                disabled={submitting || quoting || !quote || !provider}
              >
                {submitting
                  ? "Redirecting…"
                  : quote
                    ? `Pay रू ${npr(quote.totalNpr)}`
                    : "Pay"}
              </Button>

              <Link
                href="/cart"
                className="mt-3 block text-center text-sm font-medium text-ink-500 hover:text-ink-800"
              >
                ← Back to cart
              </Link>
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  );
}
