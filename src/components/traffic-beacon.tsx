"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// First-party traffic beacon. Fires once per page view (initial load and
// every client-side navigation) and posts to /api/traffic/track. No cookies,
// no personal data, and it respects Do Not Track.
const BLOCKED_PREFIXES = [
  "/api", "/admin", "/owner", "/portal", "/login", "/register",
  "/forgot-password", "/reset-password", "/verify-email", "/offline",
  "/_next", "/sw.js",
];

export function TrafficBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;
    if (BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;
    const body = JSON.stringify({ path: pathname, referrer: document.referrer || "" });
    // keepalive so the beacon survives a quick navigation away.
    fetch("/api/traffic/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}
