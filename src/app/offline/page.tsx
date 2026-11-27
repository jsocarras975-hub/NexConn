import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { OfflineRetry } from "@/components/offline-retry";

export const metadata: Metadata = { title: "Offline | N3xUs Konc3pt'z" };

export default function OfflinePage() {
  return (
    <main className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="N3xUs Konc3pt'z" className="h-16 w-16 rounded-2xl" />
      <h1 className="mt-8 text-3xl font-bold">You&rsquo;re offline</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
        N3xUs Konc3pt'z needs a connection to load fresh content. Pages you&rsquo;ve
        already visited are saved on this device — try one of them, or check
        your connection and try again.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <OfflineRetry />
        <Link href="/store" className="btn-secondary">
          Browse the store
        </Link>
      </div>
      <p className="mt-8 flex items-center gap-2 text-xs text-slate-500">
        <WifiOff size={13} /> This page works without a connection.
      </p>
    </main>
  );
}
