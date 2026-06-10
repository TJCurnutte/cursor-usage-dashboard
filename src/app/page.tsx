import Link from "next/link";
import { ArrowRight, Code2, Shield } from "lucide-react";

import { HandleSearchForm } from "@/components/handle-search-form";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#e4e4e0] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <p className="text-sm font-semibold tracking-tight text-[#14120b]">
            Cursor Usage Dashboard
          </p>
          <a
            href="https://github.com/TJCurnutte/cursor-usage-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 text-xs text-[#6b6b66] hover:text-[#14120b]"
          >
            <Code2 className="h-3.5 w-3.5" />
            Source
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#989897]">
            Open source · profile + billing
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#14120b] md:text-5xl">
            Your Cursor usage, visualized
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#6b6b66]">
            Enter any public Cursor handle to see tokens, activity, agents, and
            models. Billing pools require the local sync CLI or a self-hosted
            deploy — your Cursor token never touches our servers on the hosted
            version.
          </p>
        </div>

        <div className="mt-10 max-w-xl">
          <HandleSearchForm />
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <Feature
            title="Public profile"
            body="Tokens, streaks, agents, and model breakdown from cursor.com/@handle."
          />
          <Feature
            title="Billing via CLI"
            body="npx cursor-usage-sync reads your local Cursor login — token stays on your machine."
          />
          <Feature
            title="Self-host"
            body="Deploy your own copy with CURSOR_ACCESS_TOKEN for full billing on your infra."
          />
        </div>

        <section className="mt-16 rounded-xl border border-[#e4e4e0] bg-white p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#f54e00]" />
            <div>
              <h2 className="text-sm font-semibold text-[#14120b]">
                Security model
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6b6b66]">
                Hosted mode only reads{" "}
                <strong className="font-medium text-[#14120b]">
                  public profiles
                </strong>
                . We never ask you to paste a Cursor token. For billing data, run{" "}
                <code className="rounded bg-[#f7f7f4] px-1.5 py-0.5 font-mono text-xs">
                  npm run sync -- yourhandle
                </code>{" "}
                locally or deploy your own instance.
              </p>
              <Link
                href="/docs/security"
                className="focus-ring mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#f54e00] hover:underline"
              >
                Read security docs
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e4e4e0] py-8 text-center text-[10px] text-[#989897]">
        Not affiliated with Cursor. MIT licensed.
      </footer>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[#e4e4e0] bg-white p-4">
      <h3 className="text-sm font-semibold text-[#14120b]">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[#6b6b66]">{body}</p>
    </div>
  );
}
