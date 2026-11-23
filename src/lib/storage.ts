import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function client(){
  const accessKeyId=process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey=process.env.S3_SECRET_ACCESS_KEY;
  const region=process.env.S3_REGION||"auto";
  if(!accessKeyId||!secretAccessKey||!process.env.S3_BUCKET)throw new Error("Private object storage is not configured.");
  return new S3Client({
    region,
    endpoint:process.env.S3_ENDPOINT||undefined,
    forcePathStyle:Boolean(process.env.S3_ENDPOINT),
    credentials:{accessKeyId,secretAccessKey}
  });
}

export async function createPrivateDownloadUrl(key:string){
  const command=new GetObjectCommand({
    Bucket:process.env.S3_BUCKET,
    Key:key,
    ResponseContentDisposition:"attachment"
  });
  return getSignedUrl(client(),command,{expiresIn:300});
}
