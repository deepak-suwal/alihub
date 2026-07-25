"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/icons";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaced to the browser console; wired to Sentry/observability in production.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertIcon className="h-7 w-7" width={28} height={28} />
      </div>
      <h1 className="text-lg font-semibold text-ink-900">Something went wrong</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        An unexpected error occurred while loading this page. You can try again.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
