"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/commerce/ProductImage";
import {
  AlertIcon,
  ClipboardListIcon,
  LockIcon,
  ReceiptIcon,
  RotateCcwIcon,
  ShieldIcon,
} from "@/components/ui/icons";

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
      <div className="px-6 py-16 lg:px-12">
        <EmptyState
          icon={<ClipboardListIcon className="h-7 w-7" width={28} height={28} />}
          title="Your sourcing list is empty"
          description="Add products before checking out."
          action={
            <Link href="/" className={buttonClasses("primary", "md")}>
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      {/* Progress — the design opens checkout with the three-step ledger. */}
      <div className="flex flex-wrap items-center gap-5 border-b-2 border-divider px-6 py-4 text-[13px] lg:px-12">
        <Step n="✓" label="List reviewed" done />
        <Rule />
        <Step n="2" label="Delivery & payment" current />
        <Rule />
        <Step n="3" label="Confirm" />
        <span className="ml-auto hidden items-center gap-2 text-xs text-neutral-700 sm:flex">
          <LockIcon className="h-3.5 w-3.5" />
          Payment handled by your bank
        </span>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="border-divider px-6 py-10 lg:border-r-2 lg:px-12">
          <h1 className="mb-8 text-[30px] lg:text-[36px]">Delivery &amp; payment</h1>

          <div>
            <div className="lbl mb-4 border-b-2 border-divider pb-3">Deliver to</div>

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

            <div className="grid gap-x-5 sm:grid-cols-2">
              <Field label="City" htmlFor="city">
                <Input id="city" value={form.city} onChange={set("city")} required />
              </Field>
              <Field label="Note for the team" htmlFor="note" hint="(optional)">
                <Input id="note" value={form.note} onChange={set("note")} maxLength={500} />
              </Field>
            </div>
          </div>

          <div className="mt-8">
            <div className="lbl mb-4 border-b-2 border-divider pb-3">Pay with</div>
            <div className="grid max-w-[740px] gap-4 sm:grid-cols-2">
              {providers.map((p) => {
                const active = provider === p.code;
                return (
                  <label
                    key={p.code}
                    className={`flex cursor-pointer flex-col gap-2 p-5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                      active ? "border-2 border-accent" : "border border-divider hover:border-neutral-500"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-base font-extrabold">{p.label}</span>
                      <span
                        className={`h-3.5 w-3.5 ${active ? "bg-accent" : "border border-divider"}`}
                        aria-hidden
                      />
                    </span>
                    <span className="text-xs text-neutral-700">{PROVIDER_BLURB[p.code] ?? ""}</span>
                    <input
                      type="radio"
                      name="provider"
                      value={p.code}
                      checked={active}
                      onChange={() => setProvider(p.code)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex max-w-[740px] items-center gap-2.5 bg-surface p-3.5 text-[13px]">
              <ReceiptIcon className="h-4 w-4 shrink-0 text-accent" />
              <span>
                A VAT invoice is issued with the order — duty and VAT are itemised for your filing.
              </span>
            </div>
          </div>
        </div>

        <aside className="px-6 py-10 lg:px-8 lg:py-10">
          <div className="lg:sticky lg:top-32">
            <div className="lbl mb-4">Order summary</div>

            {quoting ? (
              <p className="py-6 text-center text-sm text-neutral-700">Fetching live prices…</p>
            ) : quoteError ? (
              <div className="border border-accent bg-accent-100 p-3 text-sm text-accent-800">
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
                <ul>
                  {quote.lines.map((line) => (
                    <li
                      key={line.productId}
                      className="flex gap-3 border-b border-divider py-3 first:border-t"
                    >
                      <ProductImage
                        src={line.imageUrl}
                        alt={line.title}
                        className="h-12 w-12 shrink-0 border border-divider"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-extrabold">{line.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-700 tabular-nums">
                          {line.qty} × {npr(line.unitPriceNpr)}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-xs font-extrabold tabular-nums">
                        {npr(line.totalNpr)}
                      </span>
                    </li>
                  ))}
                </ul>

                {quote.rejected.length > 0 ? (
                  <p className="mt-3 bg-surface p-2.5 text-xs text-neutral-700">
                    {quote.rejected.length} product{quote.rejected.length === 1 ? "" : "s"} could not be
                    priced and {quote.rejected.length === 1 ? "has" : "have"} been left out of this order.
                  </p>
                ) : null}

                <table className="table table-flush mt-4 text-[13px]">
                  <tbody>
                    <tr>
                      <td>Landed subtotal</td>
                      <td className="text-right tabular-nums">{npr(quote.subtotalNpr)}</td>
                    </tr>
                    <tr>
                      <td>VAT · 13%</td>
                      <td className="text-right tabular-nums">{npr(quote.vatNpr)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* The figure that matters, given the design's accent block. */}
                <div className="mt-4 bg-accent p-5 text-ground">
                  <div className="mb-1.5 text-[11px] uppercase tracking-[0.1em]">
                    Pay now · total landed
                  </div>
                  <div className="text-[32px] font-extrabold leading-none tabular-nums">
                    {npr(quote.totalNpr)}
                  </div>
                  <div className="mt-2 text-xs">NPR · duty, VAT and delivery included</div>
                </div>
              </>
            ) : null}

            {error ? (
              <p className="mt-4 flex items-start gap-2 border border-accent bg-accent-100 p-3 text-sm text-accent-800">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : null}

            {!durableStore ? (
              <p className="mt-4 bg-surface p-2.5 text-xs text-neutral-700">
                Development mode: orders are kept in memory only.
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-4 w-full"
              disabled={submitting || quoting || !quote || !provider}
            >
              {submitting
                ? "Redirecting…"
                : quote
                  ? `Pay with ${providers.find((p) => p.code === provider)?.label ?? "gateway"}`
                  : "Pay"}
            </Button>

            <div className="mt-4 flex flex-col gap-2 text-xs text-neutral-700">
              <span className="flex items-center gap-2">
                <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                Landed price fixed at this total — no border surprises.
              </span>
              <span className="flex items-center gap-2">
                <RotateCcwIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                Refunded in full if the supplier cannot fulfil.
              </span>
            </div>

            <Link
              href="/cart"
              className="mt-4 block text-center text-sm text-neutral-700 hover:text-accent"
            >
              ← Back to sourcing list
            </Link>
          </div>
        </aside>
      </form>
    </>
  );
}

function Step({
  n,
  label,
  done,
  current,
}: {
  n: string;
  label: string;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-2 ${current ? "font-extrabold" : "text-neutral-600"}`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center text-[11px] ${
          done
            ? "bg-neutral-400 text-ground"
            : current
              ? "bg-accent text-ground"
              : "border border-divider"
        }`}
      >
        {n}
      </span>
      {label}
    </span>
  );
}

function Rule() {
  return <span className="hidden h-0.5 w-6 bg-divider sm:block" aria-hidden />;
}

const PROVIDER_BLURB: Record<string, string> = {
  esewa: "Pay from your eSewa wallet or linked bank account.",
  khalti: "Pay with Khalti wallet, mobile banking or connected IPS.",
};
