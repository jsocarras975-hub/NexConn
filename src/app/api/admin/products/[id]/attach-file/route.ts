import { NextResponse, after } from "next/server";
import { z } from "zod";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inspectPrivateObject } from "@/lib/storage";
import { sendProductUpdateEmail } from "@/lib/transactional-email";

export const runtime = "nodejs";

const schema = z.object({
  objectKey: z.string().min(1).max(500),
  // Optional release info: when a version label is given, the attach is
  // recorded as a product version and past buyers are emailed about it.
  version: z.string().trim().min(1).max(40).optional(),
  changelog: z.string().trim().max(5000).optional(),
});
const MAX_BYTES = 100 * 1024 * 1024;
const allowedTypes = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const user = auth.user;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid uploaded object." }, { status: 400 });

  const { id } = await params;
  const expectedPrefix = `private-products/${id}/`;
  if (!parsed.data.objectKey.startsWith(expectedPrefix) || parsed.data.objectKey.includes("..")) {
    return NextResponse.json({ error: "Object key does not belong to this product." }, { status: 400 });
  }

  try {
    const object = await inspectPrivateObject(parsed.data.objectKey);
    if (object.contentLength < 1 || object.contentLength > MAX_BYTES || !allowedTypes.has(object.contentType)) {
      return NextResponse.json({ error: "Uploaded file failed storage verification." }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { downloadKey: parsed.data.objectKey },
      select: { id: true, name: true },
    });

    if (parsed.data.version) {
      await prisma.productVersion.create({
        data: {
          productId: id,
          version: parsed.data.version,
          changelog: parsed.data.changelog ?? null,
          downloadKey: parsed.data.objectKey,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "PRODUCT_VERSION_RELEASED",
          target: id,
          metadata: { version: parsed.data.version, contentLength: object.contentLength, contentType: object.contentType },
        },
      });
      const version = parsed.data.version;
      const changelog = parsed.data.changelog ?? null;
      after(async () => {
        try {
          await sendProductUpdateEmail(id, version, changelog);
        } catch (error) {
          console.error("Product update email failed", error);
        }
      });
    } else {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "PRODUCT_PRIVATE_FILE_ATTACHED",
          target: id,
          metadata: { contentLength: object.contentLength, contentType: object.contentType },
        },
      });
    }

    return NextResponse.json({ success: true, product, file: { contentLength: object.contentLength, contentType: object.contentType } });
  } catch (error) {
    console.error("Private product file attach failed", error);
    return NextResponse.json({ error: "Unable to verify or attach the uploaded file." }, { status: 503 });
  }
}
