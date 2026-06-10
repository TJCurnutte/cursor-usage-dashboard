"use client";

import Link from "next/link";
import { Sparkles, Timer } from "lucide-react";

import { UsageBarChart } from "@/components/charts/usage-bar-chart";
import { cn } from "@/lib/cn";
import type { CursorUsageSnapshot } from "@cursor-usage/core/client";
import {
  buildUsageChartCatalog,
  formatBillingReset,
  formatDuration,
  formatTokenCount,
  formatUsageMoney,
  formatUsagePercent,
} from "@cursor-usage/core/client";

export function DashboardPreview({
  snapshot,
  className,
}: {
  snapshot: CursorUsageSnapshot;
  className?: string;
}) {
  const { account, summary, stats, topModels } = snapshot;
  const catalog = buildUsageChartCatalog(snapshot, { range: "30d" });
  const tokenSeries = catalog.tokens.tokens;

  const billingReset =
    snapshot.billingAvailable && account.billingCycleEnd
      ? formatBillingReset(account.billingCycleEnd)
      : null;

  return (
    <Link
      href={`/u/${account.handle}`}
      className={cn(
        "group block focus-ring rounded-2xl outline-offset-4",
        className,
      )}
      aria-label={`View live dashboard for @${account.handle}`}
    >
      <div className="overflow-hidden rounded-2xl border border-[#e4e4e0] bg-white shadow-[0_24px_80px_-24px_rgba(20,18,11,0.18)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_32px_96px_-24px_rgba(20,18,11,0.22)]">
        <div className="flex items-center gap-2 border-b border-[#e4e4e0] bg-[#f7f7f4] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="min-w-0 flex-1 rounded-md border border-[#e4e4e0] bg-white px-3 py-1 text-center font-mono text-[10px] text-[#989897]">
            usage.neural-forge.io/u/{account.handle}
          </div>
        </div>

        <div className="space-y-4 p-4 md:p-5">
          <div className="flex items-start gap-3">
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.avatarUrl}
                alt=""
                className="h-11 w-11 rounded-full border border-[#e4e4e0] object-cover"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-[#f0f0ec]" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#14120b]">
                {account.displayName}
              </p>
              <p className="text-xs text-[#6b6b66]">
                @{account.handle}
                {account.plan ? ` · ${account.plan}` : ""}
              </p>
            </div>
          </div>

          {billingReset ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e4e0] bg-[#f7f7f4] px-3 py-2">
              <div className="flex items-center gap-2">
                <Timer className="h-3.5 w-3.5 text-[#f54e00]" />
                <span className="text-[10px] font-medium text-[#14120b]">
                  Resets {billingReset.dateLabel}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-[#14120b]">
                {billingReset.leftLabel}
              </span>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <PreviewStat
              label="Tokens"
              value={formatTokenCount(summary.totalTokens)}
            />
            <PreviewStat label="Agents" value={String(summary.totalAgents)} />
            <PreviewStat
              label="Streak"
              value={`${stats.currentStreak}d`}
              accent={stats.currentStreak >= 3}
            />
            <PreviewStat
              label={snapshot.billingAvailable ? "Included" : "Models"}
              value={
                snapshot.billingAvailable
                  ? formatUsagePercent(summary.apiPercentUsed)
                  : String(topModels[0]?.agentRequests ?? "—")
              }
              hint={
                snapshot.billingAvailable
                  ? formatUsageMoney(summary.includedUsedCents)
                  : topModels[0]?.name?.split(" ")[0]
              }
              accent={summary.apiPercentUsed >= 100}
            />
          </div>

          <div className="rounded-xl border border-[#e4e4e0] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#989897]">
                Tokens · last 30d
              </p>
              <p className="font-mono text-[10px] text-[#14120b]">
                {formatTokenCount(tokenSeries.total)}
              </p>
            </div>
            <UsageBarChart
              series={tokenSeries}
              height={112}
              valueFormatter={formatTokenCount}
              animateMs={120}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e4e4e0] bg-[#f7f7f4] px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#f54e00]" />
              <span className="text-xs font-medium text-[#14120b]">
                {topModels[0]?.name ?? "Top model"}
              </span>
            </div>
            <span className="text-[10px] text-[#6b6b66]">
              Longest agent {formatDuration(stats.longestAgentSeconds)}
            </span>
          </div>
        </div>

        <div className="border-t border-[#e4e4e0] bg-[#fafaf8] px-4 py-2.5 text-center text-[10px] font-medium text-[#f54e00] opacity-0 transition group-hover:opacity-100">
          View live dashboard →
        </div>
      </div>
    </Link>
  );
}

function PreviewStat({
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
    <div className="rounded-lg border border-[#e4e4e0] bg-white px-2.5 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#989897]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-sm font-semibold tracking-tight",
          accent ? "text-[#f54e00]" : "text-[#14120b]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[9px] text-[#989897]">{hint}</p> : null}
    </div>
  );
}
