"use client";

import Link from "next/link";

type Reason = "no_token" | "discord_unavailable";

const COPY: Record<Reason, { title: string; body: string; showRetry: boolean }> = {
  no_token: {
    title: "We can't verify your Discord access",
    body: "Sign in with Discord again so we can check which servers you manage.",
    showRetry: false,
  },
  discord_unavailable: {
    title: "Discord didn't respond",
    body: "Probably a momentary hiccup or rate limit. Refresh and try again — you usually don't need to sign in.",
    showRetry: true,
  },
};

export function BuyerAccessError({ reason }: { reason: Reason }) {
  const { title, body, showRetry } = COPY[reason];
  return (
    <div
      className="min-h-screen bg-[#10131a]"
      style={{ width: "100vw", marginLeft: "calc(50% - 50vw)", marginTop: "-40px" }}
    >
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-2 flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Seller Dashboard
          </Link>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-white">Buyer Dashboard</h1>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
          <p className="font-medium text-zinc-300">{title}</p>
          <p className="mt-2 text-sm text-zinc-500">{body}</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {showRetry && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                Try again
              </button>
            )}
            <Link
              href="/api/auth/signin"
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
                showRetry
                  ? "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                  : "bg-violet-600 text-white hover:bg-violet-500"
              }`}
            >
              Sign in with Discord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
