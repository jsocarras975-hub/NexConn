import { NextResponse } from "next/server";
import { runOverdueTaskWorkflows } from "@/lib/crm-workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const result = await runOverdueTaskWorkflows();
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("CRM scheduled workflow execution failed", error);
    return NextResponse.json({ error: "Workflow execution failed." }, { status: 500 });
  }
}
