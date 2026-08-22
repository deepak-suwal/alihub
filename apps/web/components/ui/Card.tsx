import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * A flat panel on the tinted surface. The system has no rounded cards and no
 * resting elevation — a block is separated by its ground and its rules, not
 * by a border radius or a shadow.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-surface", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

/** Panel that reads as raised (checkout summary, dialogs). */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border border-divider bg-ground", className)} {...props} />;
}
