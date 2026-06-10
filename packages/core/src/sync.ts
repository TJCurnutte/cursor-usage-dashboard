import type { CursorPublicProfile, CursorUsageSnapshot } from "./types";

function decodeFlightChunk(chunk: string): string {
  return chunk.replace(/\\(.)/g, (_, char: string) => {
    const map: Record<string, string> = {
      n: "\n",
      r: "\r",
      t: "\t",
      '"': '"',
      "\\": "\\",
    };
    return map[char] ?? char;
  });
}

export async function fetchCursorProfile(handle: string): Promise<CursorPublicProfile> {
  const response = await fetch(`https://cursor.com/@${handle}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; cursor-usage-dashboard/0.1)" },
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new Error(`Profile @${handle} not found or is private`);
  }

  if (!response.ok) {
    throw new Error(`Profile fetch failed (${response.status})`);
  }

  const html = await response.text();
  const chunks = html.matchAll(
    /self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"/g,
  );

  for (const match of chunks) {
    const decoded = decodeFlightChunk(match[1]);
    if (!decoded.includes(`"handle":"${handle}"`)) continue;

    const profileStart = decoded.indexOf('"profile":');
    if (profileStart === -1) continue;

    const text = decoded.slice(profileStart + '"profile":'.length);
    let depth = 0;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return JSON.parse(text.slice(0, index + 1)) as CursorPublicProfile;
        }
      }
    }
  }

  throw new Error(`Could not parse profile for @${handle}`);
}

type UsageSummaryResponse = {
  billingCycleStart: string;
  billingCycleEnd: string;
  membershipType?: string;
  autoModelSelectedDisplayMessage?: string;
  namedModelSelectedDisplayMessage?: string;
  individualUsage: {
    plan: {
      used: number;
      limit: number;
      remaining: number;
      autoPercentUsed: number;
      apiPercentUsed: number;
      totalPercentUsed: number;
      breakdown: {
        bonus: number;
        total: number;
        included: number;
      };
    };
    onDemand: {
      enabled: boolean;
      used: number | null;
    };
  };
};

type StripeProfileResponse = {
  individualMembershipType?: string;
  subscriptionStatus?: string;
};

async function fetchCursorApi<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`https://api2.cursor.sh${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Cursor API ${path} failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function profileToSnapshot(
  handle: string,
  profile: CursorPublicProfile,
): CursorUsageSnapshot {
  const totalTokens = (profile.tokensOverTime ?? []).reduce(
    (sum, row) => sum + row.tokens,
    0,
  );
  const now = new Date().toISOString().replace("+00:00", "Z");

  return {
    profile,
    profileUrl: `https://cursor.com/@${handle}`,
    account: {
      displayName: profile.displayName,
      handle: profile.handle ?? handle,
      joinedDate: profile.joinedDate,
      avatarUrl: profile.avatarUrl,
    },
    summary: {
      includedUsedCents: 0,
      includedLimitCents: 0,
      includedRemainingCents: 0,
      bonusUsedCents: 0,
      totalUsedCents: 0,
      includedPoolCents: 0,
      autoPercentUsed: 0,
      apiPercentUsed: 0,
      totalPercentUsed: 0,
      onDemandEnabled: false,
      onDemandUsedCents: 0,
      totalTokens,
      totalAgents: profile.stats?.agentsLocal ?? 0,
      agentsCloud: profile.stats?.agentsCloud ?? 0,
    },
    stats: profile.stats,
    activityCounts: profile.activityCounts ?? [],
    tokensOverTime: profile.tokensOverTime ?? [],
    agentsOverTime: profile.agentsOverTime ?? [],
    topModels: profile.topModels ?? [],
    billingAvailable: false,
    dataSources: {
      profile: `https://cursor.com/@${handle}`,
      billing: "unavailable on hosted — use CLI or self-host for billing",
    },
    fetchedAt: now,
  };
}

export type SyncOptions = {
  handle: string;
  token?: string | null;
  email?: string | null;
};

export async function syncCursorUsage(
  options: SyncOptions,
): Promise<CursorUsageSnapshot> {
  const { handle } = options;
  const profile = await fetchCursorProfile(handle);
  const token = options.token ?? null;
  const email = options.email ?? undefined;

  let usageSummary: UsageSummaryResponse | null = null;
  let stripeProfile: StripeProfileResponse | null = null;

  if (token) {
    [usageSummary, stripeProfile] = await Promise.all([
      fetchCursorApi<UsageSummaryResponse>(token, "/auth/usage-summary"),
      fetchCursorApi<StripeProfileResponse>(token, "/auth/full_stripe_profile"),
    ]);
  }

  const base = profileToSnapshot(handle, profile);
  if (!usageSummary) {
    return base;
  }

  const plan = usageSummary.individualUsage.plan;
  const breakdown = plan.breakdown;
  const onDemand = usageSummary.individualUsage.onDemand;
  const membership =
    usageSummary.membershipType ??
    stripeProfile?.individualMembershipType ??
    "pro";

  const planLabel = (
    {
      pro_plus: "Pro Plus",
      pro: "Pro",
      ultra: "Ultra",
    } as Record<string, string>
  )[membership] ??
    membership.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    ...base,
    account: {
      ...base.account,
      email,
      plan: planLabel,
      membershipType: membership,
      billingCycleStart: usageSummary.billingCycleStart,
      billingCycleEnd: usageSummary.billingCycleEnd,
      subscriptionStatus: stripeProfile?.subscriptionStatus ?? "active",
    },
    summary: {
      ...base.summary,
      includedUsedCents: plan.used,
      includedLimitCents: plan.limit,
      includedRemainingCents: plan.remaining,
      bonusUsedCents: breakdown.bonus,
      totalUsedCents: breakdown.total,
      includedPoolCents: breakdown.included,
      autoPercentUsed: plan.autoPercentUsed,
      apiPercentUsed: plan.apiPercentUsed,
      totalPercentUsed: plan.totalPercentUsed,
      onDemandEnabled: onDemand.enabled,
      onDemandUsedCents: onDemand.used ?? 0,
      autoModelSelectedDisplayMessage:
        usageSummary.autoModelSelectedDisplayMessage,
      namedModelSelectedDisplayMessage:
        usageSummary.namedModelSelectedDisplayMessage,
    },
    billingAvailable: true,
    dataSources: {
      profile: `https://cursor.com/@${handle}`,
      billing: "api2.cursor.sh/auth/usage-summary",
    },
    fetchedAt: new Date().toISOString().replace("+00:00", "Z"),
  };
}
