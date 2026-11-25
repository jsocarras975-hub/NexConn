import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "/privacy",
  "Privacy Policy",
  "How N3xUs Konc3pt'z collects, uses, and protects your information, and the choices you have over your data.",
);

export default function PrivacyPage() {
  return (
    <main className="container section prose-page">
      <p className="eyebrow">N3xUs Konc3pt'z / Legal</p>
      <h1 className="mt-3 text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: November 25, 2026.</p>

      <h2>What we collect</h2>
      <p>
        When you create an account we collect your name, email address, and a hashed password.
        When you buy a product or pay an invoice we collect the order and payment details needed to
        fulfil it; card details are processed by Stripe and are never stored on our servers.
        When you contact us or open a support ticket we keep your message and our reply.
        We also run first-party, anonymous traffic analytics (see below).
      </p>

      <h2>How we use it</h2>
      <p>
        Your information is used to run the studio: to fulfil orders, deliver product files,
        answer support requests, send invoices and receipts, and improve the site. We do not
        sell your information and we do not share it with advertisers.
      </p>

      <h2>Traffic analytics</h2>
      <p>
        We measure visits to our public pages with our own first-party analytics. Each page view
        records the path, the referring site, the country, and a salted hash of your IP address —
        never the address itself, and never a cookie. No third-party tracker is loaded.
        Analytics only runs if you accept it in the cookie banner; you can change your choice
        at any time by clearing the site data in your browser and revisiting.
      </p>

      <h2>Your choices</h2>
      <p>
        In your <Link href="/portal/settings">account settings</Link> you can download a copy of
        everything we hold about you, and you can delete your account. Deleting your account
        removes your tickets, projects, and messages; your orders and invoices keep only their
        financial record with no link to you, as we are required to keep for tax purposes.
        You can also email us at <a href="mailto:j.socarras@n3xuskonc3ptz.com">j.socarras@n3xuskonc3ptz.com</a> to
        ask for a copy or deletion of your data.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed, sessions are signed and HTTP-only, and product files are delivered
        through short-lived signed URLs that are checked against paid orders. No system is
        perfect; if you believe your account is compromised, reset your password and contact us.
      </p>

      <h2>Contact</h2>
      <p>
        N3xUs Konc3pt'z — <a href="mailto:j.socarras@n3xuskonc3ptz.com">j.socarras@n3xuskonc3ptz.com</a>,
        phone <a href="tel:+12102751837">210-275-1837</a>.
      </p>
    </main>
  );
}
