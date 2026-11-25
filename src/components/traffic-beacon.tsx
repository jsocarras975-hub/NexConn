"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// First-party traffic beacon. Fires once per page view (initial load and
// every client-side navigation) and posts to /api/traffic/track. No cookies,
// no personal data, it respects Do Not Track, and it only runs after the
// visitor accepts analytics in the cookie banner (M11).
const BLOCKED_PREFIXES = [
  "/api", "/admin", "/owner", "/portal", "/login", "/register",
  "/forgot-password", "/reset-password", "/verify-email", "/offline",
  "/_next", "/sw.js",
];

import { analyticsConsented } from "@/components/cookie-consent";

export function TrafficBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    if (!analyticsConsented()) return;
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;
    if (BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;
    const body = JSON.stringify({ path: pathname, referrer: document.referrer || "" });
    // keepalive so the beacon survives a quick navigation away.
    fetch("/api/traffic/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}
