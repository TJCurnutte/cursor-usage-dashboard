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
      <header className="sticky top-0 z-40 border-b border-[#e4e4e0] bg-white/95 backdrop-blur safe-px">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-[#14120b] hover:underline"
          >
            ← Usage Dashboard
          </Link>
          <div className="w-full sm:max-w-xs md:max-w-sm">
            <HandleSearchForm defaultHandle={handle} />
          </div>
        </div>
      </header>
      <UsageDashboard initialSnapshot={snapshot} handle={handle} />
    </div>
  );
}
