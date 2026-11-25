import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "/terms",
  "Terms of Service",
  "The terms for using N3xUs Konc3pt'z products and services.",
);

export default function TermsPage() {
  return (
    <main className="container section prose-page">
      <p className="eyebrow">N3xUs Konc3pt'z / Legal</p>
      <h1 className="mt-3 text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: November 25, 2026.</p>

      <h2>Services</h2>
      <p>
        N3xUs Konc3pt'z provides web design, web development, custom bots, hosting, and digital
        products. Prices on this site are final prices. Project work is scoped and priced in
        writing before work begins; the price on the site is the price for the service as described.
      </p>

      <h2>Digital products</h2>
      <p>
        Digital products are delivered as files after payment. Your licence is personal and
        non-transferable unless the product page says otherwise. You may not resell or
        redistribute the files. Download links are signed, expire after five minutes, and are
        checked against your paid orders.
      </p>

      <h2>Accounts</h2>
      <p>
        You are responsible for keeping your account credentials safe and for activity under
        your account. We may suspend or close accounts that abuse the service, attempt to
        access other customers' data, or break the law.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use our services to break the law, to harass or deceive anyone, or to distribute
        malware. Bots and templates we build for you must not be used to spam or to impersonate
        another person or business.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Our services are provided as-is. To the extent the law allows, our liability for any
        claim is limited to the amount you paid for the service in question.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms; the date above shows the latest version. Continued use of
        the site after a change means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        N3xUs Konc3pt'z — <a href="mailto:j.socarras@n3xuskonc3ptz.com">j.socarras@n3xuskonc3ptz.com</a>,
        phone <a href="tel:+12102751837">210-275-1837</a>.
      </p>
    </main>
  );
}
