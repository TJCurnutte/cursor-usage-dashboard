export type UsageTrackEventType =
  | "page_view"
  | "handle_search"
  | "profile_view"
  | "refresh";

export type UsageTrackPayload = {
  eventType: UsageTrackEventType;
  handle?: string;
  path?: string;
};

const VISITOR_KEY = "usage-dash-vid";
const SESSION_KEY = "usage-dash-sid";
const LANDING_KEY = "usage-dash-landing";

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId() {
  if (typeof window === "undefined") return undefined;
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getSessionId() {
  if (typeof window === "undefined") return undefined;
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = randomId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getLandingPage() {
  if (typeof window === "undefined") return undefined;
  let landing = sessionStorage.getItem(LANDING_KEY);
  if (!landing) {
    landing = `${window.location.pathname}${window.location.search}`;
    sessionStorage.setItem(LANDING_KEY, landing);
  }
  return landing;
}

function readUtmParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
  };
}

export async function trackUsageEvent(payload: UsageTrackPayload) {
  if (typeof window === "undefined") return;

  const body = {
    ...payload,
    path: payload.path ?? window.location.pathname,
    referrer: document.referrer || undefined,
    ...readUtmParams(),
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    landingPage: getLandingPage(),
    userAgent: navigator.userAgent,
    sourceSite: "usage.neural-forge.io",
  };

  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // non-blocking
  }
}
