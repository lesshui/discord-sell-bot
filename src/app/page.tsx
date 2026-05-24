import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#10131a] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs text-blue-300">
            Pokemon Trading Cards MVP
          </span>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Instant offers with Discord order rooms.
          </h1>
          <p className="text-zinc-400 text-lg">
            Submit your Pokemon cards, receive an immediate offer, and track your order through
            a private Discord channel — from shipping to payout.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/api/auth/signin"
            className="w-full sm:w-auto rounded-xl bg-violet-600 px-8 py-3 font-semibold text-white hover:bg-violet-500 transition-colors"
          >
            Sign in with Discord
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {[
            { title: "Instant Offers", desc: "Get a configurable offer immediately after submitting your card details and photos." },
            { title: "Private Channels", desc: "A dedicated Discord channel tracks every step — shipping, inspection, and payout." },
            { title: "Flexible Payout", desc: "Choose Zelle, PayPal, Crypto, or wire once your card passes inspection." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left">
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
