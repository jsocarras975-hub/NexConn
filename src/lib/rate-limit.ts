import { createHash } from "node:crypto";

type RateLimitPolicy = {
  name: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult =
  | { allowed: true; configured: boolean }
  | { allowed: false; configured: true; retryAfter: number };

function getClientKey(request: Request, policyName: string) {
  // Vercel supplies x-real-ip. The forwarded-for fallback supports common
  // reverse proxies; deploy only behind a proxy that sanitizes this header.
  const ip =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const digest = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  return `nexcon:ratelimit:${policyName}:${digest}`;
}

export async function enforceRateLimit(
  request: Request,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  // Prefer the names the Vercel Upstash integration creates
  // (UPSTASH_REDIS_KV_REST_API_URL / UPSTASH_REDIS_KV_REST_API_TOKEN,
  // the read-write REST token). The UPSTASH_REDIS_REST_* names are the
  // fallback for local development. A manually copied token that turns
  // out to be the read-only one fails closed here, so the integration
  // values must win whenever they exist.
  const url =
    process.env.UPSTASH_REDIS_KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.UPSTASH_REDIS_KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN;

  // Optional during local development only. In production an unconfigured
  // rate limiter fails closed: public auth and payment endpoints must never
  // run unlimited because a variable was forgotten in Vercel.
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.error("NEXCON rate limiting is not configured.");
      return { allowed: false, configured: true, retryAfter: 60 };
    }
    return { allowed: true, configured: false };
  }

  const key = getClientKey(request, policy.name);
  // EVAL is a single command: Upstash documents it as a POST to the base
  // REST URL with the command as a JSON array, not inside /pipeline.
  const endpoint = url.replace(/\/+$/, "");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        "local current = redis.call('INCR', KEYS[1]); if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return current",
        "1",
        key,
        String(policy.windowSeconds),
      ]),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Rate-limit provider returned ${response.status}.`);
    const payload = (await response.json()) as {
      error?: string;
      result?: number | string | Array<{ result?: number | string; error?: string }>;
    };

    // Direct EVAL reply: { "result": <count> }. Accept the pipeline
    // nesting too, in case the provider ever wraps it.
    const raw = Array.isArray(payload.result)
      ? payload.result[0]?.result
      : payload.result;
    const count = Number(raw);
    if (
      !Number.isFinite(count) ||
      payload.error ||
      (Array.isArray(payload.result) && payload.result.some((item) => item.error))
    ) {
      throw new Error("Rate-limit provider returned an invalid response.");
    }

    if (count > policy.limit) {
      return {
        allowed: false,
        configured: true,
        retryAfter: policy.windowSeconds,
      };
    }

    return { allowed: true, configured: true };
  } catch (error) {
    // Fail closed when rate limiting was explicitly configured but unavailable.
    console.error("NEXCON rate-limit check failed.", error);
    return { allowed: false, configured: true, retryAfter: 60 };
  }
}
