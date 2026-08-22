import type { Metadata } from "next";
import Link from "next/link";
import { availableProviders } from "@/lib/payments/registry";
import { orderStoreIsDurable } from "@/lib/orders/store";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm your sourcing order and pay in NPR with eSewa or Khalti.",
};

// Provider availability comes from server-side env, so this page must not be
// prerendered at build time.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const providers = availableProviders();

  if (providers.length === 0) {
    return (
      <div className="mx-auto max-w-xl border border-divider bg-ground p-6 text-center">
        <h1 className="text-lg font-extrabold text-ink">Online payment is unavailable</h1>
        <p className="mt-2 text-sm text-neutral-700">
          No payment gateway is configured on this deployment yet. Please contact the Alihub team to place
          your order.
        </p>
        <Link href="/cart" className="mt-5 inline-block text-sm text-accent-700 hover:text-accent-800">
          ← Back to cart
        </Link>
      </div>
    );
  }

  return <CheckoutForm providers={providers} durableStore={orderStoreIsDurable()} />;
}
