"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Analytics consent (M11). First-party analytics only runs after the
// visitor accepts; declining (or never choosing) means no page views are
// recorded. The choice is stored locally, never sent to a third party.
export const ANALYTICS_CONSENT_KEY = "n3xus_analytics_consent";

export function analyticsConsented(): boolean {
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ANALYTICS_CONSENT_KEY)) setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  function choose(value: "accepted" | "declined") {
    try { localStorage.setItem(ANALYTICS_CONSENT_KEY, value); } catch { /* storage unavailable — the banner just shows again */ }
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0b1220]/95 px-4 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-sm text-slate-300">
          We measure visits with our own anonymous analytics — no cookies, no third parties.
          Accept to help us see which pages are useful, or decline and nothing is recorded.{" "}
          <Link href="/privacy" className="text-cyan-300 underline">Privacy Policy</Link>
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={() => choose("accepted")}>Accept</button>
          <button type="button" className="btn-secondary" onClick={() => choose("declined")}>Decline</button>
        </div>
      </div>
    </div>
  );
}
