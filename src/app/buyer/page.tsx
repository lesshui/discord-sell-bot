import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAccessibleBotServers } from "@/lib/discord-guilds";
import { BuyerAccessError } from "@/components/BuyerAccessError";

export const dynamic = "force-dynamic";

function ServerIcon({ name, iconUrl }: { name: string; iconUrl: string | null }) {
  if (iconUrl) {
    return <img src={iconUrl} alt={name} className="h-12 w-12 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-700 text-lg font-bold text-white">
      {name[0]}
    </div>
  );
}

export default async function BuyerEntryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const result = await getAccessibleBotServers(session.user.id);

  if (!result.ok) {
    return <BuyerAccessError reason={result.reason} />;
  }

  const servers = result.servers;

  if (servers.length === 1 && servers[0].role === "owner") {
    redirect(`/buyer/${servers[0].id}`);
  }

  return (
    <div className="min-h-screen bg-[#10131a]">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-2 flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Seller Dashboard
          </Link>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-white">Buyer Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Select a Discord server you own where the bot is active.
        </p>

        <div className="mt-8 space-y-3">
          {servers.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
              <p className="text-zinc-300 font-medium">No active bot servers found</p>
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
          ) : (
            servers.map((server) => (
              <div key={server.id}>
                {server.role === "owner" ? (
                  <Link
                    href={`/buyer/${server.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-violet-700 transition-colors group"
                  >
                    <ServerIcon name={server.name} iconUrl={server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png` : null} />
                    <div className="flex-1">
                      <p className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                        {server.name}
                      </p>
                      <p className="text-xs text-zinc-400">Owner · Full access</p>
                    </div>
                    <span className="text-zinc-500 group-hover:text-violet-400">→</span>
                  </Link>
                ) : (
                  <Link
                    href={`/buyer/${server.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-600 transition-colors group"
                  >
                    <ServerIcon name={server.name} iconUrl={server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png` : null} />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{server.name}</p>
                      <p className="text-xs text-zinc-400">Admin · View only</p>
                    </div>
                    <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">View only</span>
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
