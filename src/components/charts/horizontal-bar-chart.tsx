import { cn } from "@/lib/cn";
import type { ChartDatum } from "@cursor-usage/core/client";

type HorizontalBarChartProps = {
  data: ChartDatum[];
  className?: string;
  maxItems?: number;
};

export function HorizontalBarChart({
  data,
  className,
  maxItems = 6,
}: HorizontalBarChartProps) {
  const items = data.slice(0, maxItems);
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return (
      <p className={cn("text-[11px] text-[#989897]", className)}>No data yet.</p>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
            <span className="truncate text-[#6b6b66]">{item.label}</span>
            <span className="shrink-0 font-mono text-[#14120b]">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f0f0ec]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? "#14120b",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
