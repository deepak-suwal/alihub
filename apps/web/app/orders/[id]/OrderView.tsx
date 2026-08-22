"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ProductImage } from "@/components/commerce/ProductImage";
import { AlertIcon, CheckIcon, TruckIcon } from "@/components/ui/icons";

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
    <div className="mx-auto max-w-3xl">
      {paid ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-emerald-900">
              {justPaid ? "Payment received" : "This order is paid"}
            </h1>
            <p className="mt-1 text-sm text-emerald-800">
              Order <span className="font-semibold">{order.id}</span> is confirmed. Our team will verify stock
              with the supplier and contact you on {order.customer.phone} with the shipping timeline.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h1 className="text-lg font-bold text-ink-900">
            {expired ? "This order expired" : "Payment not confirmed"}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {error
              ? error
              : expired
                ? "The payment window closed before we received a confirmation. You can place the order again."
                : "We have not received a confirmation for this order yet."}
          </p>
          {checkError ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-brand-800">
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

      <Card>
        <CardBody>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink-900">Order {order.id}</h2>
            <span className="text-xs text-ink-400">
              {new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>

          <ul className="divide-y divide-ink-100">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-4 py-3">
                <Link
                  href={`/products/${line.slug}`}
                  className="shrink-0 overflow-hidden rounded-lg border border-ink-100"
                >
                  <ProductImage src={line.imageUrl} alt={line.title} className="h-14 w-14" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-ink-900">{line.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {line.qty} × रू {npr(line.unitPriceNpr)}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-ink-900">
                  रू {npr(line.totalNpr)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm">
            <div className="flex justify-between text-ink-600">
              <dt>Subtotal (landed)</dt>
              <dd className="tabular-nums">रू {npr(order.subtotalNpr)}</dd>
            </div>
            <div className="flex justify-between text-ink-600">
              <dt>VAT 13%</dt>
              <dd className="tabular-nums">रू {npr(order.vatNpr)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-ink-900">
              <dt>Total paid</dt>
              <dd className="tabular-nums">रू {npr(order.totalNpr)}</dd>
            </div>
          </dl>

          {order.payment ? (
            <p className="mt-3 text-xs text-ink-500">
              Paid with {PROVIDER_LABELS[order.payment.provider] ?? order.payment.provider} · reference{" "}
              <span className="font-mono">{order.payment.gatewayRef}</span>
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink-900">
            <TruckIcon className="h-4 w-4 text-ink-400" /> Delivery
          </h2>
          <p className="text-sm text-ink-700">{order.customer.fullName}</p>
          <p className="text-sm text-ink-600">
            {order.customer.address}, {order.customer.city}
          </p>
          <p className="text-sm text-ink-600">{order.customer.phone}</p>
          {order.customer.email ? <p className="text-sm text-ink-600">{order.customer.email}</p> : null}
          {order.customer.note ? (
            <p className="mt-2 text-sm text-ink-500">Note: {order.customer.note}</p>
          ) : null}
        </CardBody>
      </Card>

      <div className="mt-4">
        <Link href="/" className="text-sm font-medium text-ink-500 hover:text-ink-800">
          ← Continue browsing
        </Link>
      </div>
    </div>
  );
}
