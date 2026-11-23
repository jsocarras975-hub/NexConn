import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validators";
import { sendEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runInquiryWorkflows } from "@/lib/crm-workflows";
import { verifyCaptcha } from "@/lib/captcha";

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

    if (process.env.OWNER_EMAIL) {
      const safeName = parsed.data.name.replace(/[&<>"]/g, "");
      const safeService = parsed.data.service.replace(/[&<>"]/g, "");
      void sendEmail({
        to: process.env.OWNER_EMAIL,
        subject: `New N3xUs Konc3pt'z inquiry: ${safeService}`,
        html: `<p>New project inquiry from ${safeName} (${parsed.data.email}).</p><p>Service: ${safeService}</p><p>${parsed.data.details.replace(/[&<>"]/g, "")}</p>`,
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We couldn't save your inquiry. Please try again." }, { status: 500 });
  }
}
