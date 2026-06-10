"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  CalendarRange,
  Download,
  ExternalLink,
  Flame,
  Gauge,
  Layers3,
  LineChart,
  RefreshCw,
  Settings2,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";

import { UsageBarChart } from "@/components/charts/usage-bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { cn } from "@/lib/cn";
import type {
  CursorUsageSnapshot,
  UsageChartView,
  UsageDateRange,
  UsageMetric,
} from "@cursor-usage/core/client";
import {
  billingProgress,
  buildUsageChartCatalog,
  exportUsageCsv,
  formatBillingReset,
  formatDuration,
  formatTokenCount,
  formatUsageMoney,
  formatUsagePercent,
  metricsForView,
} from "@cursor-usage/core/client";

const VIEW_OPTIONS: Array<{
  id: UsageChartView;
  label: string;
  icon: typeof LineChart;
  defaultMetric: UsageMetric;
  requiresBilling?: boolean;
}> = [
  { id: "tokens", label: "Tokens", icon: LineChart, defaultMetric: "tokens" },
  { id: "activity", label: "Activity", icon: CalendarRange, defaultMetric: "activity" },
  { id: "agents", label: "Agents", icon: Users, defaultMetric: "agents" },
  { id: "models", label: "Models", icon: Layers3, defaultMetric: "requests" },
  { id: "pools", label: "Billing ($)", icon: Gauge, defaultMetric: "spend", requiresBilling: true },
];

const METRIC_LABELS: Record<UsageMetric, string> = {
  tokens: "Tokens",
  activity: "Activity",
  agents: "Agents",
  requests: "Requests",
  spend: "Spend",
};

const RANGE_OPTIONS: Array<{ id: UsageDateRange; label: string }> = [
  { id: "30d", label: "Last 30d" },
  { id: "7d", label: "Last 7d" },
  { id: "cycle", label: "All data" },
];

function ChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#989897]">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={value === option.id}
            className={cn(
              "focus-ring rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
              value === option.id
                ? "border-[#14120b] bg-[#14120b] text-white"
                : "border-[#e4e4e0] bg-white text-[#6b6b66] hover:border-[#14120b]/30 hover:text-[#14120b]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e4e4e0] bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#989897]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tracking-tight",
          accent ? "text-[#f54e00]" : "text-[#14120b]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[#6b6b66]">{hint}</p> : null}
    </div>
  );
}

function PoolMeter({
  label,
  used,
  limit,
  percent,
  tone,
}: {
  label: string;
  used: number;
  limit: number;
  percent: number;
  tone: "dark" | "accent";
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#14120b]">{label}</p>
          <p className="mt-0.5 font-mono text-[11px] text-[#6b6b66]">
            {formatUsageMoney(used)} / {formatUsageMoney(limit)}
          </p>
        </div>
        <p
          className={cn(
            "font-mono text-sm font-semibold",
            percent >= 100 ? "text-[#f54e00]" : "text-[#14120b]",
          )}
        >
          {formatUsagePercent(percent)}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f0f0ec]">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-150 ease-out",
            tone === "accent" ? "bg-[#f54e00]" : "bg-[#14120b]",
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e4e4e0] bg-white p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#14120b]">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-[#6b6b66]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function UsageDashboard({
  initialSnapshot,
  handle,
}: {
  initialSnapshot: CursorUsageSnapshot;
  handle: string;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [now, setNow] = useState(() => Date.now());
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { account, summary, stats, topModels, profileUrl, dataSources, fetchedAt, billingAvailable } =
    snapshot;

  const [view, setView] = useState<UsageChartView>("tokens");
  const [metric, setMetric] = useState<UsageMetric>("tokens");
  const [range, setRange] = useState<UsageDateRange>("30d");
  const [showCustomize, setShowCustomize] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleViews = VIEW_OPTIONS.filter(
    (option) => !option.requiresBilling || billingAvailable,
  );

  const catalog = useMemo(
    () => buildUsageChartCatalog(snapshot, { range }),
    [snapshot, range],
  );

  const allowedMetrics = useMemo(() => metricsForView(view), [view]);
  const resolvedMetric = allowedMetrics.includes(metric) ? metric : allowedMetrics[0];
  const activeSeries = catalog[view][resolvedMetric];

  const valueFormatter = useCallback(
    (value: number) => {
      if (resolvedMetric === "spend") return formatUsageMoney(value);
      if (resolvedMetric === "tokens") return formatTokenCount(value);
      return value.toLocaleString();
    },
    [resolvedMetric],
  );

  const billingReset =
    account.billingCycleEnd && billingAvailable
      ? formatBillingReset(account.billingCycleEnd, now)
      : null;

  const cyclePct =
    account.billingCycleStart && account.billingCycleEnd && billingAvailable
      ? billingProgress(account.billingCycleStart, account.billingCycleEnd)
      : 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const response = await fetch(`/api/profile/${handle}`, { method: "POST" });
      const payload = (await response.json()) as CursorUsageSnapshot | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Refresh failed");
      }
      setSnapshot(payload as CursorUsageSnapshot);
      setNow(Date.now());
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewChange = (next: UsageChartView) => {
    const option = VIEW_OPTIONS.find((item) => item.id === next);
    setView(next);
    if (option) setMetric(option.defaultMetric);
  };

  const handleExport = () => {
    const label = VIEW_OPTIONS.find((item) => item.id === view)?.label ?? view;
    const csv = exportUsageCsv(activeSeries, label);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cursor-usage-${handle}-${view}-${range}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const joinedDays = account.joinedDate
    ? Math.floor((Date.now() - new Date(account.joinedDate).getTime()) / 86400000)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {account.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={account.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full border border-[#e4e4e0] object-cover"
            />
          ) : null}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#989897]">
              Cursor usage dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#14120b]">
              {account.displayName}
            </h1>
            <p className="mt-1 text-sm text-[#6b6b66]">
              @{account.handle}
              {account.plan ? ` · ${account.plan}` : ""}
              {account.email ? ` · ${account.email}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#989897]">
              {joinedDays !== null ? <span>Joined {joinedDays} days ago</span> : null}
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#f54e00] hover:underline"
              >
                cursor.com/@{account.handle}
                <ExternalLink className="h-3 w-3" />
              </a>
              {fetchedAt ? (
                <span>
                  Synced{" "}
                  {new Date(fetchedAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[#e4e4e0] bg-white px-3 py-2 text-xs font-medium text-[#14120b] transition hover:border-[#14120b]/20 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => setShowCustomize((v) => !v)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[#e4e4e0] bg-white px-3 py-2 text-xs font-medium text-[#14120b]"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {showCustomize ? "Hide controls" : "Customize"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[#e4e4e0] bg-white px-3 py-2 text-xs font-medium text-[#14120b]"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {refreshError ? (
        <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-xs text-[#991b1b]">
          {refreshError}
        </p>
      ) : null}

      {billingReset ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4e4e0] bg-[#f7f7f4] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Timer className="h-4 w-4 text-[#f54e00]" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#989897]">
                Usage resets
              </p>
              <p className="text-sm font-medium text-[#14120b]">{billingReset.dateLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-semibold tracking-tight text-[#14120b]">
              {billingReset.leftLabel}
            </p>
            <p className="text-[11px] text-[#6b6b66]">
              {billingReset.totalHours.toLocaleString()} hours · {Math.round(cyclePct)}% elapsed
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tokens"
          value={`${formatTokenCount(summary.totalTokens)} tokens`}
          hint={`Most active ${stats.mostActiveDay ?? stats.mostActiveMonth ?? "—"}`}
        />
        <StatCard
          label="Agents"
          value={String(summary.totalAgents)}
          hint={`Local ${stats.agentsLocal} · Cloud ${stats.agentsCloud}`}
        />
        <StatCard
          label="Streak"
          value={`${stats.currentStreak}d current`}
          hint={`Longest ${stats.longestStreak}d · Longest agent ${formatDuration(stats.longestAgentSeconds)}`}
          accent={stats.currentStreak >= 3}
        />
        {billingAvailable ? (
          <StatCard
            label="Included API"
            value={formatUsagePercent(summary.apiPercentUsed)}
            hint={`${formatUsageMoney(summary.includedUsedCents)} of ${formatUsageMoney(summary.includedLimitCents)} · resets in ${billingReset?.totalHours ?? 0}h`}
            accent={summary.apiPercentUsed >= 100}
          />
        ) : (
          <StatCard label="Billing" value="CLI / self-host" hint="Public profile stats above" />
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Panel
          title="Usage graph"
          description="From your public cursor.com profile"
          action={
            <div className="flex flex-wrap gap-1 rounded-lg border border-[#e4e4e0] bg-[#f7f7f4] p-0.5">
              {visibleViews.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleViewChange(id)}
                  aria-pressed={view === id}
                  className={cn(
                    "focus-ring inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition",
                    view === id
                      ? "bg-white text-[#14120b] shadow-sm"
                      : "text-[#6b6b66] hover:text-[#14120b]",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {showCustomize ? (
            <div className="mb-4 grid gap-4 border-b border-[#e4e4e0] pb-4 md:grid-cols-2">
              <ChipGroup
                label="Metric"
                value={resolvedMetric}
                options={allowedMetrics.map((id) => ({
                  id,
                  label: METRIC_LABELS[id],
                }))}
                onChange={(next) => startTransition(() => setMetric(next))}
              />
              <ChipGroup
                label="Date range"
                value={range}
                options={RANGE_OPTIONS}
                onChange={(next) => startTransition(() => setRange(next))}
              />
            </div>
          ) : null}

          <UsageBarChart
            series={activeSeries}
            height={view === "models" ? 120 : 168}
            valueFormatter={valueFormatter}
            animateMs={120}
          />
        </Panel>

        <div className="space-y-4">
          <Panel title="Models" description={`cursor.com/@${account.handle}`}>
            {topModels.length ? (
              <div className="space-y-3">
                {topModels.map((model) => (
                  <div
                    key={model.name}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e4e0] bg-[#f7f7f4] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#f54e00]" />
                      <span className="text-sm font-medium text-[#14120b]">{model.name}</span>
                    </div>
                    <span className="font-mono text-xs text-[#6b6b66]">
                      {model.agentRequests} requests
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#989897]">No model breakdown yet.</p>
            )}
          </Panel>
          <Panel title="Agent split">
            <DonutChart
              data={[
                { label: "Local", value: stats.agentsLocal, color: "#f54e00" },
                { label: "Cloud", value: stats.agentsCloud, color: "#14120b" },
              ]}
              centerValue={summary.totalAgents}
              centerLabel="agents"
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Top models by requests">
          <HorizontalBarChart
            data={topModels.map((row) => ({
              label: row.name,
              value: row.agentRequests,
              color: "#f54e00",
            }))}
            maxItems={6}
          />
        </Panel>

        {billingAvailable ? (
          <Panel title="Billing pools" description={dataSources.billing}>
            <div className="space-y-4">
              <PoolMeter
                label="Included API usage"
                used={summary.includedUsedCents}
                limit={summary.includedLimitCents}
                percent={summary.apiPercentUsed}
                tone="dark"
              />
              <PoolMeter
                label="Auto + Composer (bonus pool)"
                used={summary.bonusUsedCents}
                limit={summary.totalUsedCents}
                percent={summary.autoPercentUsed}
                tone="accent"
              />
            </div>
            <p className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-[#6b6b66]">
              <Flame className="h-3.5 w-3.5 text-[#f54e00]" />
              Cycle total {formatUsageMoney(summary.totalUsedCents)}
            </p>
          </Panel>
        ) : (
          <Panel title="Billing pools" description="Requires local sync or self-host">
            <p className="text-xs leading-relaxed text-[#6b6b66]">
              Hosted mode shows public profile stats only. To see included API usage and
              billing pools, run the sync CLI locally or deploy this repo to your own Vercel
              project with{" "}
              <code className="rounded bg-[#f7f7f4] px-1 font-mono text-[10px]">
                CURSOR_ACCESS_TOKEN
              </code>
              .
            </p>
          </Panel>
        )}
      </div>

      <p className="text-center text-[10px] text-[#989897]">
        {dataSources.profile}
        {dataSources.billing ? ` · ${dataSources.billing}` : ""}
      </p>
    </div>
  );
}
