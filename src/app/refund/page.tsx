import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "/refund",
  "Refund Policy",
  "When N3xUs Konc3pt'z refunds digital products and project work, and how to ask for one.",
);

export default function RefundPage() {
  return (
    <main className="container section prose-page">
      <p className="eyebrow">N3xUs Konc3pt'z / Legal</p>
      <h1 className="mt-3 text-3xl font-semibold">Refund Policy</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: November 25, 2026.</p>

      <h2>Digital products</h2>
      <p>
        Because digital products are delivered immediately as downloadable files, we generally
        do not offer refunds once a file has been downloaded. If the file is broken, does not
        match its description, or you were charged twice, contact us within 14 days of purchase
        and we will fix it or refund you.
      </p>

      <h2>Project work</h2>
      <p>
        For design, development, and bot projects, deposits are non-refundable once work has
        started, because the work is custom and cannot be resold. If we cannot deliver what was
        agreed, we will refund the unused portion of your payment.
      </p>

      <h2>Hosting</h2>
      <p>
        Hosting is billed monthly. Cancel any time; you keep service until the end of the paid
        month and are not charged again. We do not refund partial months.
      </p>

      <h2>How to ask for a refund</h2>
      <p>
        Email <a href="mailto:j.socarras@n3xuskonc3ptz.com">j.socarras@n3xuskonc3ptz.com</a> with
        your order number and what went wrong, or open a support ticket from your portal.
        We aim to reply within two business days. Approved refunds go back to the original
        payment method within 5–10 business days.
      </p>
    </main>
  );
}
