"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ProductImage } from "@/components/commerce/ProductImage";
import { AlertIcon, CheckIcon, ReceiptIcon, TruckIcon } from "@/components/ui/icons";

interface OrderLine {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  qty: number;
  unitPriceNpr: number;
  totalNpr: number;
}

export interface PublicOrder {
  id: string;
  status: string;
  createdAt: string;
  customer: { fullName: string; phone: string; email?: string; address: string; city: string; note?: string };
  lines: OrderLine[];
  subtotalNpr: number;
  vatNpr: number;
  totalNpr: number;
  payment?: { provider: string; gatewayRef: string; confirmedAt: string };
}

const npr = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PROVIDER_LABELS: Record<string, string> = { esewa: "eSewa", khalti: "Khalti" };

export function OrderView({
  order: initial,
  expired,
  justPaid,
  error,
}: {
  order: PublicOrder;
  expired: boolean;
  justPaid?: boolean;
  error?: string;
}) {
  const [order, setOrder] = useState(initial);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const { clear } = useCart();
  const cleared = useRef(false);

  // The cart is held until payment actually confirms, so a failed attempt can
  // be retried from the same cart. Once paid, it has served its purpose.
  useEffect(() => {
    if (order.status === "PAID" && !cleared.current) {
      cleared.current = true;
      clear();
    }
  }, [order.status, clear]);

  async function recheck() {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/refresh`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not check the payment status");
      setOrder(data.order as PublicOrder);
      if (data.order.status !== "PAID") {
        setCheckError(data.reason ?? "The gateway has not confirmed this payment yet.");
      }
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : "Could not check the payment status");
    } finally {
      setChecking(false);
    }
  }

  const paid = order.status === "PAID";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-12">
      {paid ? (
        <div className="mb-8 flex items-start gap-4 bg-accent p-6 text-ground">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-ground text-accent">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-[22px] text-ground">
              {justPaid ? "Payment received" : "This order is paid"}
            </h1>
            <p className="mt-1.5 max-w-[640px] text-sm">
              Order <span className="font-extrabold">{order.id}</span> is confirmed. Our team will verify
              stock with the supplier and contact you on {order.customer.phone} with the shipping
              timeline.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-8 border border-divider p-6">
          <h1 className="text-[22px]">
            {expired ? "This order expired" : "Payment not confirmed"}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-800">
            {error
              ? error
              : expired
                ? "The payment window closed before we received a confirmation. You can place the order again."
                : "We have not received a confirmation for this order yet."}
          </p>
          {checkError ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-accent-800">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {checkError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={recheck} disabled={checking} variant="secondary">
              {checking ? "Checking…" : "Check payment status"}
            </Button>
            <Link href="/checkout" className={buttonClasses("primary", "md")}>
              Try payment again
            </Link>
          </div>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b-2 border-divider pb-3">
          <h2 className="text-lg font-extrabold">Order {order.id}</h2>
          <span className="lbl">
              {new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>

        <ul>
          {order.lines.map((line) => (
            <li key={line.productId} className="flex items-center gap-4 border-b border-divider py-4">
              <Link href={`/products/${line.slug}`} className="shrink-0 border border-divider">
                <ProductImage src={line.imageUrl} alt={line.title} className="h-14 w-14" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-extrabold">{line.title}</p>
                <p className="mt-0.5 text-xs tabular-nums text-neutral-700">
                  {line.qty} × {npr(line.unitPriceNpr)}
                </p>
              </div>
              <span className="whitespace-nowrap text-sm font-extrabold tabular-nums">
                {npr(line.totalNpr)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <table className="table table-flush">
            <tbody>
              <tr>
                <td>Landed subtotal</td>
                <td className="text-right tabular-nums">{npr(order.subtotalNpr)}</td>
              </tr>
              <tr>
                <td>VAT · 13%</td>
                <td className="text-right tabular-nums">{npr(order.vatNpr)}</td>
              </tr>
              <tr>
                <td className="font-extrabold">Total paid</td>
                <td className="text-right text-lg font-extrabold tabular-nums">
                  {npr(order.totalNpr)}
                </td>
              </tr>
            </tbody>
          </table>

          <div>
            <div className="lbl mb-3 flex items-center gap-2">
              <TruckIcon className="h-3.5 w-3.5" /> Delivery
            </div>
            <p className="text-sm font-extrabold">{order.customer.fullName}</p>
            <p className="text-sm text-neutral-800">
              {order.customer.address}, {order.customer.city}
            </p>
            <p className="text-sm text-neutral-800">{order.customer.phone}</p>
            {order.customer.email ? (
              <p className="text-sm text-neutral-800">{order.customer.email}</p>
            ) : null}
            {order.customer.note ? (
              <p className="mt-2 text-sm text-neutral-700">Note: {order.customer.note}</p>
            ) : null}

            {order.payment ? (
              <p className="mt-4 flex items-start gap-2 bg-surface p-3 text-xs text-neutral-800">
                <ReceiptIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>
                  Paid with {PROVIDER_LABELS[order.payment.provider] ?? order.payment.provider} ·
                  reference <span className="font-mono">{order.payment.gatewayRef}</span>
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-8">
        <Link href="/" className="text-sm text-neutral-700 hover:text-accent">
          ← Continue browsing
        </Link>
      </div>
    </div>
  );
}
