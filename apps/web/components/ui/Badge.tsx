import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "outline";

const tones: Record<Tone, string> = {
  neutral: "tag-neutral",
  accent: "tag-accent",
  outline: "tag-outline",
};

/** Square-cornered tag, per the design system's `.tag` family. */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn("tag", tones[tone], className)} {...props} />;
}

/**
 * Maps an order/payment status to a tone. The system carries only one accent,
 * so a good state is stated in words and given the accent; anything unresolved
 * stays neutral rather than inventing a semantic palette the system lacks.
 */
export function statusTone(status: string): Tone {
  const s = status.toUpperCase();
  if (["PAID", "CONFIRMED", "COMPLETED", "DELIVERED", "SUCCESS"].includes(s)) return "accent";
  return "neutral";
}
