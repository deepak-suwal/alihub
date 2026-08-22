import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn("input min-h-[44px]", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cn("input min-h-[44px] cursor-pointer pr-8", className)} {...props} />;
});

/** Label + control pair. `.field` styles the label per the design system. */
export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("field mb-5", className)}>
      <label htmlFor={htmlFor}>
        {label}
        {hint ? <span className="ml-1 text-neutral-600">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

/** Uppercase micro-label that opens a section, over a 2px rule. */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("lbl mb-4 border-b-2 border-divider pb-3", className)}>{children}</div>
  );
}
