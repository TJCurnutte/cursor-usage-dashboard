import { NextResponse } from "next/server";

import {
  fetchCursorProfile,
  getCursorAccessToken,
  getCursorCachedEmail,
  isValidHandle,
  normalizeHandle,
  profileToSnapshot,
  syncCursorUsage,
} from "@cursor-usage/core";

import { rateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ handle: string }> };

async function loadSnapshot(handle: string) {
  const token = await getCursorAccessToken();
  if (token) {
    return syncCursorUsage({
      handle,
      token,
      email: await getCursorCachedEmail(),
    });
  }
  const profile = await fetchCursorProfile(handle);
  return profileToSnapshot(handle, profile);
}

export async function GET(_request: Request, context: RouteContext) {
  const handle = normalizeHandle((await context.params).handle);

  if (!isValidHandle(handle)) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }

  const limited = rateLimit(`profile:${handle}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter ?? 60) },
      },
    );
  }

  try {
    return NextResponse.json(await loadSnapshot(handle));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fetch failed" },
      { status: 502 },
    );
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const handle = normalizeHandle((await context.params).handle);

  if (!isValidHandle(handle)) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }

  const limited = rateLimit(`refresh:${handle}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter ?? 60) },
      },
    );
  }

  try {
    return NextResponse.json(await loadSnapshot(handle));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refresh failed" },
      { status: 502 },
    );
  }
}
