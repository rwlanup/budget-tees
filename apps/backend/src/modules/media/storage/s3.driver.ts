import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { StorageDriver } from './storage.interface';

export interface S3DriverOptions {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKey: string;
  secretKey: string;
  cdnBaseUrl?: string;
}

/** Production driver for S3 / Spaces / MinIO (any S3-compatible store). */
export class S3Driver implements StorageDriver {
  readonly name = 's3';
  private readonly client: S3Client;

  constructor(private readonly opts: S3DriverOptions) {
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint || undefined,
      forcePathStyle: !!opts.endpoint, // needed for MinIO/Spaces custom endpoints
      credentials: { accessKeyId: opts.accessKey, secretAccessKey: opts.secretKey },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.opts.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return this.url(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.opts.bucket, Key: key }));
  }

  url(key: string): string {
    if (this.opts.cdnBaseUrl) return `${this.opts.cdnBaseUrl}/${key}`;
    if (this.opts.endpoint) return `${this.opts.endpoint}/${this.opts.bucket}/${key}`;
    return `https://${this.opts.bucket}.s3.${this.opts.region}.amazonaws.com/${key}`;
  }
}
