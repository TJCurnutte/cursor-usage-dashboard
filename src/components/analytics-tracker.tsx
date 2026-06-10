"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { trackUsageEvent } from "@/lib/analytics";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const profileMatch = pathname.match(/^\/u\/([a-zA-Z0-9_-]+)$/);
    if (profileMatch) {
      void trackUsageEvent({
        eventType: "profile_view",
        handle: profileMatch[1],
      });
      return;
    }

    if (pathname === "/") {
      void trackUsageEvent({ eventType: "page_view" });
    }
  }, [pathname, searchParams]);

  return null;
}
