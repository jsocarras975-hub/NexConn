import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPrivateUploadUrl } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 100 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const schema = z.object({
  contentType: z.string().min(1).max(150),
  contentLength: z.number().int().positive().max(MAX_BYTES),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const user = auth.user;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success || !allowedTypes[parsed.data?.contentType]) {
    return NextResponse.json({ error: "Unsupported file type or invalid file size." }, { status: 400 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const bucket = process.env.S3_BUCKET;
  if (!bucket || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: "Private storage is not configured." }, { status: 503 });
  }

  const extension = allowedTypes[parsed.data.contentType];
  const key = `private-products/${id}/${randomUUID()}.${extension}`;

  try {
    const uploadUrl = await createPrivateUploadUrl({
      key,
      contentType: parsed.data.contentType,
      contentLength: parsed.data.contentLength,
    });
    await prisma.auditLog.create({
      data: { actorId: user.id, action: "PRODUCT_FILE_UPLOAD_URL_CREATED", target: id },
    });
    return NextResponse.json(
      { uploadUrl, objectKey: key, expiresInSeconds: 300, requiredHeaders: { "Content-Type": parsed.data.contentType } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Private upload URL creation failed", error);
    return NextResponse.json({ error: "Unable to prepare secure upload." }, { status: 503 });
  }
}
