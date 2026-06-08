import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAccessibleBotServers } from "@/lib/discord-guilds";
import { BuyerAccessError } from "@/components/BuyerAccessError";

export const dynamic = "force-dynamic";

export default async function BuyerEntryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const result = await getAccessibleBotServers(session.user.id);
  if (!result.ok) {
    return <BuyerAccessError reason={result.reason} />;
  }

  // Owner role first, then admin; alphabetical within each so the landing
  // server is deterministic across reloads.
  const best = [...result.servers].sort((a, b) => {
    if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
    return a.name.localeCompare(b.name);
  })[0];

  if (best) redirect(`/buyer/${best.id}`);

  // Zero accessible servers — show the install-the-bot empty state.
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
          <p className="font-medium text-zinc-300">No active bot servers found</p>
          <p className="mt-2 text-sm text-zinc-500">
            You need to be the owner of a Discord server where the bot is installed and active.
          </p>
          <a
            href="https://discord.com/oauth2/authorize"
            className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
          >
            Add bot to your server
          </a>
        </div>
      </div>
    </div>
  );
}
