import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Maps an order/payment status string to a semantic tone. */
export function statusTone(status: string): Tone {
  const s = status.toUpperCase();
  if (["PAID", "CONFIRMED", "COMPLETED", "DELIVERED", "SUCCESS"].includes(s)) return "success";
  if (["PENDING_PAYMENT", "PENDING", "PROCESSING", "AWAITING"].some((p) => s.includes(p))) return "warning";
  if (["CANCELLED", "FAILED", "REFUNDED", "DEAD_LETTER"].some((p) => s.includes(p))) return "danger";
  return "neutral";
}
