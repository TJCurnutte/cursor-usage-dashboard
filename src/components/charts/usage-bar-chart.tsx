"use client";

import { memo, useMemo } from "react";

import { cn } from "@/lib/cn";
import type { UsageChartSeries } from "@cursor-usage/core/client";

type UsageBarChartProps = {
  series: UsageChartSeries;
  className?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
  animateMs?: number;
};

function UsageBarChartInner({
  series,
  className,
  height = 168,
  valueFormatter = (value) => value.toLocaleString(),
  animateMs = 120,
}: UsageBarChartProps) {
  const { points, max } = series;

  const barLayout = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        barHeight: Math.max(4, (point.value / max) * (height - 28)),
      })),
    [points, max, height],
  );

  if (points.every((point) => point.value === 0)) {
    return (
      <p className={cn("text-[11px] text-[#989897]", className)}>
        No usage in this window.
      </p>
    );
  }

  const showEveryLabel = points.length <= 10;
  const showValues = points.length <= 14;
  const minChartWidth = Math.max(points.length * 28, 280);

  return (
    <div className={cn("scroll-x-touch -mx-1 overflow-x-auto px-1", className)}>
      <div
        className="flex items-end gap-0.5 sm:gap-1"
        style={{ height, minWidth: points.length > 12 ? minChartWidth : undefined }}
        role="img"
        aria-label={`Usage chart, ${points.length} bars`}
      >
        {barLayout.map((point, index) => {
          const showLabel = showEveryLabel || index % 2 === 0;
          return (
            <div
              key={point.key}
              className="flex min-w-[22px] flex-1 flex-col items-center justify-end gap-0.5 sm:min-w-0 sm:gap-1"
              title={`${point.label}: ${valueFormatter(point.value)}`}
            >
              {point.value > 0 && showValues ? (
                <span className="hidden font-mono text-[9px] text-[#989897] sm:inline">
                  {valueFormatter(point.value)}
                </span>
              ) : (
                <span className="h-3" aria-hidden />
              )}
              <div
                className="w-full max-w-6 rounded-t-sm"
                style={{
                  height: point.barHeight,
                  backgroundColor: point.color ?? "#14120b",
                  opacity: point.value > 0 ? 1 : 0.35,
                  transition: `height ${animateMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  willChange: "height",
                }}
              />
              {showLabel ? (
                <span className="max-w-full truncate text-center text-[7px] text-[#989897] sm:text-[8px]">
                  {point.label}
                </span>
              ) : (
                <span className="h-2.5" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const UsageBarChart = memo(UsageBarChartInner);
