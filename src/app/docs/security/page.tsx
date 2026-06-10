import Link from "next/link";

export default function SecurityDocsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#e4e4e0] bg-white px-4 py-4 safe-px md:px-6">
        <Link href="/" className="text-sm font-semibold text-[#14120b] hover:underline">
          ← Back
        </Link>
      </header>
      <article className="mx-auto max-w-2xl px-4 py-8 safe-px sm:py-12 md:px-6">
        <h1 className="text-2xl font-semibold text-[#14120b]">Security</h1>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#6b6b66]">
          <h2 className="text-base font-semibold text-[#14120b]">What we access</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[#14120b]">Hosted dashboard:</strong> public
              cursor.com/@handle pages only (tokens, activity, agents, models).
            </li>
            <li>
              <strong className="text-[#14120b]">Billing API:</strong> only when you
              run the sync CLI locally or self-host with your own{" "}
              <code className="rounded bg-[#f7f7f4] px-1 font-mono text-xs">
                CURSOR_ACCESS_TOKEN
              </code>
              .
            </li>
          </ul>

          <h2 className="pt-4 text-base font-semibold text-[#14120b]">
            What we never do
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Ask you to paste a Cursor session token into a web form</li>
            <li>Store Cursor tokens on the hosted multi-tenant deployment</li>
            <li>Invent or estimate usage numbers</li>
          </ul>

          <h2 className="pt-4 text-base font-semibold text-[#14120b]">
            Local sync CLI
          </h2>
          <p>
            The CLI reads your token from the Cursor desktop app&apos;s local
            database on your machine. It calls Cursor&apos;s API directly from your
            computer and writes a JSON snapshot locally.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-[#14120b] p-4 font-mono text-xs text-white">
            npm run sync -- yourhandle
          </pre>

          <h2 className="pt-4 text-base font-semibold text-[#14120b]">Self-host</h2>
          <p>
            Deploy your own Vercel project from this repo. Set{" "}
            <code className="rounded bg-[#f7f7f4] px-1 font-mono text-xs">
              CURSOR_ACCESS_TOKEN
            </code>{" "}
            in your project env — the token stays in your Vercel account, not ours.
          </p>
        </section>
      </article>
    </div>
  );
}
