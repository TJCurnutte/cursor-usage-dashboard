"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/cn";
import { trackUsageEvent } from "@/lib/analytics";

export function HandleSearchForm({
  defaultHandle = "",
  className,
}: {
  defaultHandle?: string;
  className?: string;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState(defaultHandle);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = handle.trim().replace(/^@/, "").toLowerCase();
    if (!/^[a-zA-Z0-9_-]{2,32}$/.test(normalized)) {
      setError("Handle must be 2–32 characters (letters, numbers, _ or -)");
      return;
    }
    setError(null);
    void trackUsageEvent({ eventType: "handle_search", handle: normalized });
    router.push(`/u/${normalized}`);
  };

  return (
    <form onSubmit={submit} className={cn("space-y-2", className)}>
      <label htmlFor="handle" className="sr-only">
        Cursor handle
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#989897]">
            @
          </span>
          <input
            id="handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="yourhandle"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            className="focus-ring w-full rounded-lg border border-[#e4e4e0] bg-white py-3.5 pl-8 pr-3 font-mono text-base text-[#14120b] placeholder:text-[#989897] sm:py-3 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="focus-ring inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#14120b] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#14120b]/90 sm:w-auto"
        >
          <Search className="h-4 w-4" />
          View dashboard
        </button>
      </div>
      {error ? <p className="text-xs text-[#991b1b]">{error}</p> : null}
    </form>
  );
}
