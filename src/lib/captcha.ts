// Cloudflare Turnstile CAPTCHA verification (server-side).
//
// The widget itself lives in src/components/turnstile.tsx and posts its token
// as `captchaToken` in the form JSON. This helper checks that token with
// Cloudflare. It follows the same fail-closed rule as the rate limiter:
// if TURNSTILE_SECRET_KEY is missing in production, verification fails
// instead of silently letting bots through. Local development skips the
// check so the app can run without Turnstile keys.

export type CaptchaCheck = { ok: true } | { ok: false; reason: string };

function clientIp(request: Request): string | null {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

export async function verifyCaptcha(
  request: Request,
  token: string | null | undefined,
): Promise<CaptchaCheck> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("NEXCON Turnstile is not configured.");
      return {
        ok: false,
        reason: "Security check is not configured. Please try again later.",
      };
    }
    console.warn("NEXCON Turnstile is not configured; skipping CAPTCHA in development.");
    return { ok: true };
  }

  if (!token) {
    return { ok: false, reason: "Please complete the security check." };
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    const ip = clientIp(request);
    if (ip) body.set("remoteip", ip);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body, cache: "no-store" },
    );
    const data = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (data.success) return { ok: true };

    console.error("NEXCON Turnstile verification failed.", data["error-codes"]);
    return { ok: false, reason: "Security check failed. Please try again." };
  } catch (error) {
    console.error("NEXCON Turnstile verification error.", error);
    return {
      ok: false,
      reason: "Security check could not be completed. Please try again.",
    };
  }
}
