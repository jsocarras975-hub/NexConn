// Cloudflare Turnstile widget (client component).
//
// Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set, so local
// development works without keys. The server still decides: in production a
// missing TURNSTILE_SECRET_KEY fails the check closed (see src/lib/captcha.ts).
// The widget token is single-use; forms remount this component (via `key`)
// after a successful submit so a fresh challenge is shown.
//
// The script URL must be the versioned one: the unversioned
// /turnstile/api.js path was retired by Cloudflare and returns 404, which
// silently left every form without a widget (found 2026-11-25).

"use client";

import { useEffect, useRef } from "react";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": () => onExpire?.(),
        "error-callback": () => onExpire?.(),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existing = document.querySelector(
        `script[src="${SCRIPT_URL}"]`,
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", renderWidget);
      } else {
        const script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget already gone; nothing to clean up.
        }
        widgetIdRef.current = null;
      }
    };
    // onVerify/onExpire are stable setState wrappers in the forms using this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}
