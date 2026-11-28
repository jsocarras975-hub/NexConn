import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validators";
import { sendEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runInquiryWorkflows } from "@/lib/crm-workflows";
import { verifyCaptcha } from "@/lib/captcha";
import { notifyTelegram } from "@/lib/telegram";

export async function POST(req: Request) {
  const limit = await enforceRateLimit(req, {
    name: "inquiry",
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many inquiries from this connection. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const parsed = inquirySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please complete the required fields correctly." }, { status: 400 });
    }

    const captcha = await verifyCaptcha(req, parsed.data.captchaToken);
    if (!captcha.ok) return NextResponse.json({ error: captcha.reason }, { status: 400 });

    // captchaToken is a request-only field, not an Inquiry column.
    const { captchaToken: _captchaToken, ...inquiryData } = parsed.data;
    const inquiry = await prisma.inquiry.create({ data: inquiryData });
    try { await runInquiryWorkflows(inquiry.id); }
    catch (error) { console.error("Inquiry CRM workflow failed", error); }

    // Instant owner alert via the studio Telegram bot (no-op until the
    // TELEGRAM_* env vars are set). after() so it never delays the response.
    after(async () => {
      await notifyTelegram(
        `📩 New inquiry on N3xUsKonc3ptz.com\nService: ${parsed.data.service}\nFrom: ${parsed.data.name} (${parsed.data.email})\n${parsed.data.details}`,
      );
    });

    if (process.env.OWNER_EMAIL) {
      const safeName = parsed.data.name.replace(/[&<>"]/g, "");
      const safeService = parsed.data.service.replace(/[&<>"]/g, "");
      const safeDetails = parsed.data.details.replace(/[&<>"]/g, "");
      const ownerEmail = process.env.OWNER_EMAIL;
      const senderEmail = parsed.data.email;
      // Send after the response so a slow mail provider never delays the
      // inquiry confirmation. Failures are logged, not swallowed.
      after(async () => {
        try {
          const result = await sendEmail({
            to: ownerEmail,
            subject: `New N3xUs Konc3pt'z inquiry: ${safeService}`,
            html: `<p>New project inquiry from ${safeName} (${senderEmail}).</p><p>Service: ${safeService}</p><p>${safeDetails}</p>`,
          });
          if (!result.sent) console.error("Inquiry notification email failed", result.reason);
        } catch (error) {
          console.error("Inquiry notification email failed", error);
        }
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We couldn't save your inquiry. Please try again." }, { status: 500 });
  }
}
