export type CursorProfileStats = {
  mostActiveMonth?: string;
  mostActiveDay?: string;
  longestStreak: number;
  currentStreak: number;
  agentsLocal: number;
  agentsCloud: number;
  longestAgentSeconds: number;
};

export type CursorPublicProfile = {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  joinedDate?: string;
  stats: CursorProfileStats;
  activityCounts: Array<{ date: string; count: number }>;
  tokensOverTime: Array<{ date: string; tokens: number }>;
  agentsOverTime: Array<{ date: string; local: number; cloud: number }>;
  topModels: Array<{ name: string; agentRequests: number }>;
};

export type CursorUsageAccount = {
  email?: string;
  displayName: string;
  handle: string;
  plan?: string;
  membershipType?: string;
  billingCycleStart?: string;
  billingCycleEnd?: string;
  subscriptionStatus?: string;
  joinedDate?: string;
  avatarUrl?: string;
};

export type CursorUsageSummary = {
  includedUsedCents: number;
  includedLimitCents: number;
  includedRemainingCents: number;
  bonusUsedCents: number;
  totalUsedCents: number;
  includedPoolCents: number;
  autoPercentUsed: number;
  apiPercentUsed: number;
  totalPercentUsed: number;
  onDemandEnabled: boolean;
  onDemandUsedCents: number;
  autoModelSelectedDisplayMessage?: string;
  namedModelSelectedDisplayMessage?: string;
  totalTokens: number;
  totalAgents: number;
  agentsCloud: number;
};

export type CursorUsageSnapshot = {
  profile?: CursorPublicProfile;
  profileUrl: string;
  account: CursorUsageAccount;
  summary: CursorUsageSummary;
  stats: CursorProfileStats;
  activityCounts: Array<{ date: string; count: number }>;
  tokensOverTime: Array<{ date: string; tokens: number }>;
  agentsOverTime: Array<{ date: string; local: number; cloud: number }>;
  topModels: Array<{ name: string; agentRequests: number }>;
  billingAvailable: boolean;
  dataSources: {
    profile: string;
    billing?: string;
  };
  fetchedAt: string;
};

export type UsageChartView =
  | "tokens"
  | "activity"
  | "agents"
  | "models"
  | "pools";

export type UsageMetric =
  | "tokens"
  | "activity"
  | "agents"
  | "requests"
  | "spend";

export type UsageDateRange = "cycle" | "30d" | "7d";

export type UsageChartPoint = {
  key: string;
  label: string;
  value: number;
  color?: string;
};

export type UsageChartSeries = {
  view: UsageChartView;
  metric: UsageMetric;
  points: UsageChartPoint[];
  max: number;
  total: number;
};

export type ChartDatum = {
  label: string;
  value: number;
  color?: string;
};

export const HANDLE_PATTERN = /^[a-zA-Z0-9_-]{2,32}$/;

export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(handle);
}
