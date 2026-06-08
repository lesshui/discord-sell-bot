import Link from "next/link";

type Reason = "no_token" | "discord_unavailable";

const COPY: Record<Reason, { title: string; body: string }> = {
  no_token: {
    title: "We can't verify your Discord access",
    body: "Sign in with Discord again so we can check which servers you manage.",
  },
  discord_unavailable: {
    title: "Discord didn't respond",
    body: "Your Discord session may have expired, or Discord is temporarily unavailable. Try signing in again.",
  },
};

export function BuyerAccessError({ reason }: { reason: Reason }) {
  const { title, body } = COPY[reason];
  return (
    <div className="min-h-screen bg-[#10131a]">
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
          <Link
            href="/api/auth/signin"
            className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
          >
            Sign in with Discord
          </Link>
        </div>
      </div>
    </div>
  );
}
