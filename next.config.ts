import type { NextConfig } from "next";

// Content Security Policy. What the app actually loads in the browser:
// - Same-origin scripts, styles, images and fonts (Next.js, Tailwind).
// - Cloudflare Turnstile (challenges.cloudflare.com): widget script, its
//   iframe, and its verification calls. Nothing else is loaded cross-origin:
//   Stripe checkout is a server-side redirect (no Stripe.js in the browser),
//   Resend is server-side only, and product images come from the configured
//   S3 public base URL over HTTPS (covered by img-src https:).
// Next.js without a nonce setup needs 'unsafe-inline' for its own scripts
// and styles; that is the standard trade-off until nonces are introduced.
// If a new third-party embed is added later, extend the matching directive
// here instead of loosening default-src. To debug a report without blocking,
// change "Content-Security-Policy" to "Content-Security-Policy-Report-Only".
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // These URLs carry bearer tokens. Next.js applies config headers
      // after middleware, so the no-referrer/no-store treatment has to live
      // here too — the middleware sets the same values as defense in depth.
      // When two rules match, the later rule wins for a duplicate key, so
      // these specific rules come after the general one.
      {
        source: "/reset-password",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        source: "/verify-email",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
