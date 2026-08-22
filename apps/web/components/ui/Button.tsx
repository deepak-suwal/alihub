import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

/** Heights follow the design: 36 for dense rows, 44 for forms, 48 for page CTAs. */
const sizes: Record<Size, string> = {
  sm: "min-h-[36px] px-3 text-[13px]",
  md: "min-h-[44px] px-5",
  lg: "min-h-[48px] px-6",
};

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn("btn", variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

/** Same visual language as Button, for `next/link` and anchor usage. */
export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn("btn", variants[variant], sizes[size], className);
}
