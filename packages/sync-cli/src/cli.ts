#!/usr/bin/env npx tsx
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getCursorAccessToken,
  getCursorCachedEmail,
  isValidHandle,
  normalizeHandle,
  syncCursorUsage,
} from "@cursor-usage/core";

const args = process.argv.slice(2);
let handle = "";
let outPath = "";

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--out" || arg === "-o") {
    outPath = args[++i] ?? "";
  } else if (arg === "--help" || arg === "-h") {
    console.log(`cursor-usage-sync — sync Cursor usage to JSON

Usage: npm run sync -- [@handle] [-o file.json]

Billing reads your local Cursor token (never sent to third parties).
Set CURSOR_ACCESS_TOKEN to override.`);
    process.exit(0);
  } else if (!arg.startsWith("-")) {
    handle = normalizeHandle(arg);
  }
}

if (!handle) {
  handle = normalizeHandle(process.env.CURSOR_PROFILE_HANDLE ?? "");
}

if (!handle || !isValidHandle(handle)) {
  console.error("Error: provide a valid @handle");
  process.exit(1);
}

const token = await getCursorAccessToken();
const email = await getCursorCachedEmail();

if (!token) {
  console.warn("Warning: no Cursor token — profile only, no billing");
}

const snapshot = await syncCursorUsage({ handle, token, email });
const target =
  outPath ||
  join(dirname(fileURLToPath(import.meta.url)), "../../../.cursor-usage", `${handle}.json`);

await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(snapshot, null, 2), "utf8");

console.log(`Synced @${handle} → ${target}`);
console.log(`  tokens: ${(snapshot.summary.totalTokens / 1e6).toFixed(1)}M`);
console.log(`  billing: ${snapshot.billingAvailable ? "yes" : "profile only"}`);
