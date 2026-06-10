"use client";

import { Suspense } from "react";

import { AnalyticsTracker } from "@/components/analytics-tracker";

export function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}
