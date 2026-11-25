import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function client() {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || "auto";

  if (!accessKeyId || !secretAccessKey || !process.env.S3_BUCKET) {
    throw new Error("Private object storage is not configured.");
  }

  return new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function createPrivateDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: "attachment",
  });
  return getSignedUrl(client(), command, { expiresIn: 300 });
}

export async function createPrivateUploadUrl(args: {
  key: string;
  contentType: string;
  contentLength: number;
}) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: args.key,
    ContentType: args.contentType,
    ContentLength: args.contentLength,
    ServerSideEncryption: "AES256",
  });
  // Sign Content-Type and Content-Length explicitly: the default presigner
  // does not bind them, so a client could upload a different type or size
  // than the one the server approved. With them signed, S3 rejects a PUT
  // whose headers do not match the approved values.
  return getSignedUrl(client(), command, {
    expiresIn: 300,
    signableHeaders: new Set(["content-type", "content-length"]),
  });
}

export async function inspectPrivateObject(key: string) {
  const result = await client().send(new HeadObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  }));
  return {
    contentLength: result.ContentLength ?? 0,
    contentType: result.ContentType ?? "",
  };
}
