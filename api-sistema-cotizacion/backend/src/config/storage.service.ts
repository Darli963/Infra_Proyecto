import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { config } from "./env";

const s3 = new S3Client({ region: config.aws.region });

/**
 * Sube un buffer al bucket S3 y devuelve la URL pública
 * (accedida vía CloudFront o directamente según la configuración del bucket).
 */
export async function uploadImage(
  buffer: Buffer,
  mimetype: string,
  folder = "motorcycle-images"
): Promise<string> {
  const ext = mimetype.split("/")[1] ?? "jpg";
  const key = `${folder}/${randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket:      config.aws.s3Bucket,
    Key:         key,
    Body:        buffer,
    ContentType: mimetype,
  }));

  // Si existe CloudFront, usa su dominio; si no, URL directa de S3
  const base = config.aws.cloudfrontUrl
    ? config.aws.cloudfrontUrl.replace(/\/$/, "")
    : `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com`;

  return `${base}/${key}`;
}
