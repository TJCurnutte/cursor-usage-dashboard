import { NextResponse } from "next/server";

type Body = {
  eventType: string;
  handle?: string;
  path?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  sessionId?: string;
  visitorId?: string;
  userAgent?: string;
  landingPage?: string;
  sourceSite?: string;
};

export async function POST(request: Request) {
  const ingestUrl =
    process.env.USAGE_ANALYTICS_INGEST_URL ??
    "https://local.neural-forge.io/api/usage-analytics/ingest";
  const secret = process.env.USAGE_ANALYTICS_INGEST_SECRET;

  if (!secret) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: text || "Ingest failed" },
      { status: response.status },
    );
  }

  return NextResponse.json({ ok: true });
}
