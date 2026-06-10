import type {
  CursorUsageSnapshot,
  UsageChartPoint,
  UsageChartSeries,
  UsageChartView,
  UsageDateRange,
  UsageMetric,
} from "./types";

const MODEL_COLOR = "#f54e00";
const POOL_COLORS = {
  included: "#14120b",
  bonus: "#f54e00",
};

export function formatUsageMoney(centsValue: number) {
  return `$${(centsValue / 100).toFixed(2)}`;
}

export function formatUsagePercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatTokenCount(tokens: number) {
  if (tokens >= 1_000_000_000) return `${(tokens / 1_000_000_000).toFixed(1)}B`;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toLocaleString();
}

export function formatDuration(seconds: number) {
  if (seconds >= 86400) {
    return `${Math.round(seconds / 86400)}d`;
  }
  if (seconds >= 3600) {
    return `${Math.round(seconds / 3600)}h`;
  }
  return `${Math.max(1, Math.round(seconds / 60))}m`;
}

export type BillingTimeRemaining = {
  ms: number;
  days: number;
  hours: number;
  totalHours: number;
};

export function billingTimeRemaining(endIso: string, now = Date.now()) {
  const ms = Math.max(0, new Date(endIso).getTime() - now);
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return { ms, days, hours, totalHours };
}

export function formatBillingReset(endIso: string, now = Date.now()) {
  const end = new Date(endIso);
  const remaining = billingTimeRemaining(endIso, now);
  const dateLabel = end.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year:
      end.getFullYear() !== new Date(now).getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
  const leftLabel =
    remaining.days > 0
      ? `${remaining.days}d ${remaining.hours}h left`
      : `${Math.max(remaining.totalHours, 0)}h left`;

  return { dateLabel, leftLabel, totalHours: remaining.totalHours, end, remaining };
}

export function billingProgress(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const pct = ((Date.now() - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, pct));
}

function filterByRange<T extends { date: string }>(
  rows: T[],
  range: UsageDateRange,
): T[] {
  if (range === "cycle") return rows;
  const days = range === "7d" ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return rows.filter((row) => row.date >= cutoffIso);
}

function shortDayLabel(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function finalizeSeries(
  view: UsageChartView,
  metric: UsageMetric,
  points: UsageChartPoint[],
): UsageChartSeries {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const max = Math.max(...points.map((point) => point.value), 1);
  return { view, metric, points, max, total };
}

export function metricsForView(view: UsageChartView): UsageMetric[] {
  switch (view) {
    case "tokens":
      return ["tokens"];
    case "activity":
      return ["activity"];
    case "agents":
      return ["agents"];
    case "models":
      return ["requests"];
    case "pools":
      return ["spend"];
    default:
      return ["tokens"];
  }
}

export function buildUsageChartCatalog(
  snapshot: CursorUsageSnapshot,
  options: { range: UsageDateRange },
): Record<UsageChartView, Record<UsageMetric, UsageChartSeries>> {
  const views: UsageChartView[] = [
    "tokens",
    "activity",
    "agents",
    "models",
    "pools",
  ];
  const metrics: UsageMetric[] = [
    "tokens",
    "activity",
    "agents",
    "requests",
    "spend",
  ];

  const catalog = {} as Record<
    UsageChartView,
    Record<UsageMetric, UsageChartSeries>
  >;

  for (const view of views) {
    catalog[view] = {} as Record<UsageMetric, UsageChartSeries>;
    for (const metric of metrics) {
      let points: UsageChartPoint[] = [];

      if (view === "tokens" && metric === "tokens") {
        points = filterByRange(snapshot.tokensOverTime, options.range).map(
          (row) => ({
            key: row.date,
            label: shortDayLabel(row.date),
            value: row.tokens,
            color: MODEL_COLOR,
          }),
        );
      } else if (view === "activity" && metric === "activity") {
        points = filterByRange(snapshot.activityCounts, options.range).map(
          (row) => ({
            key: row.date,
            label: shortDayLabel(row.date),
            value: row.count,
            color: MODEL_COLOR,
          }),
        );
      } else if (view === "agents" && metric === "agents") {
        points = filterByRange(snapshot.agentsOverTime, options.range).map(
          (row) => ({
            key: row.date,
            label: shortDayLabel(row.date),
            value: row.local,
            color: MODEL_COLOR,
          }),
        );
      } else if (view === "models" && metric === "requests") {
        points = snapshot.topModels.map((row) => ({
          key: row.name,
          label: row.name.split(" ").slice(0, 2).join(" "),
          value: row.agentRequests,
          color: MODEL_COLOR,
        }));
      } else if (view === "pools" && metric === "spend") {
        points = [
          {
            key: "included",
            label: "Included API",
            value: snapshot.summary.includedUsedCents,
            color: POOL_COLORS.included,
          },
          {
            key: "bonus",
            label: "Auto & Composer",
            value: snapshot.summary.bonusUsedCents,
            color: POOL_COLORS.bonus,
          },
        ].filter((row) => row.value > 0);
      }

      catalog[view][metric] = finalizeSeries(view, metric, points);
    }
  }

  return catalog;
}

export function exportUsageCsv(series: UsageChartSeries, viewLabel: string) {
  const header = "label,value";
  const rows = series.points.map(
    (point) => `"${point.label.replace(/"/g, '""')}",${point.value}`,
  );
  return [`# ${viewLabel}`, header, ...rows].join("\n");
}
