import type { Metadata } from "next";
import Link from "next/link";
import { Hexagon, WifiOff } from "lucide-react";
import { OfflineRetry } from "@/components/offline-retry";

export const metadata: Metadata = { title: "Offline | NEXCON" };

export default function OfflinePage() {
  return (
    <main className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400">
        <Hexagon size={34} />
      </span>
      <h1 className="mt-8 text-3xl font-bold">You&rsquo;re offline</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
        NEXCON needs a connection to load fresh content. Pages you&rsquo;ve
        already visited are saved on this device — try one of them, or check
        your connection and try again.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <OfflineRetry />
        <Link href="/marketplace" className="btn-secondary">
          Browse the marketplace
        </Link>
      </div>
      <p className="mt-8 flex items-center gap-2 text-xs text-slate-500">
        <WifiOff size={13} /> This page works without a connection.
      </p>
    </main>
  );
}
