import { cn } from "@/lib/cn";
import type { ChartDatum } from "@cursor-usage/core/client";

type DonutChartProps = {
  data: ChartDatum[];
  className?: string;
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
};

export function DonutChart({
  data,
  className,
  size = 112,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <p className={cn("text-[11px] text-[#989897]", className)}>No data yet.</p>
    );
  }

  const radius = 42;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f0f0ec" strokeWidth={stroke} />
          {data.map((item) => {
            const fraction = item.value / total;
            const dash = fraction * circumference;
            const circle = (
              <circle
                key={item.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={item.color ?? "#14120b"}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        {(centerLabel || centerValue !== undefined) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue !== undefined && (
              <p className="text-lg font-semibold leading-none text-[#14120b]">
                {centerValue}
              </p>
            )}
            {centerLabel && (
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-[#989897]">
                {centerLabel}
              </p>
            )}
          </div>
        )}
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-[10px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color ?? "#14120b" }}
            />
            <span className="min-w-0 flex-1 truncate text-[#6b6b66]">{item.label}</span>
            <span className="shrink-0 font-mono text-[#14120b]">
              {Math.round((item.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
