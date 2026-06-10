import Link from "next/link";
import { notFound } from "next/navigation";

import { UsageDashboard } from "@/components/usage-dashboard";
import { HandleSearchForm } from "@/components/handle-search-form";
import {
  fetchCursorProfile,
  isValidHandle,
  normalizeHandle,
  profileToSnapshot,
} from "@cursor-usage/core";

type PageProps = {
  params: Promise<{ handle: string }>;
};

export default async function UserUsagePage({ params }: PageProps) {
  const handle = normalizeHandle((await params).handle);

  if (!isValidHandle(handle)) {
    notFound();
  }

  let snapshot;
  try {
    const profile = await fetchCursorProfile(handle);
    snapshot = profileToSnapshot(handle, profile);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#e4e4e0] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-[#14120b] hover:underline"
          >
            ← Cursor Usage Dashboard
          </Link>
          <div className="w-full max-w-xs md:w-72">
            <HandleSearchForm defaultHandle={handle} />
          </div>
        </div>
      </header>
      <UsageDashboard initialSnapshot={snapshot} handle={handle} />
    </div>
  );
}
