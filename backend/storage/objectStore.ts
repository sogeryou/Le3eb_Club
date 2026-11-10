import { S3Client, PutObjectCommand, HeadBucketCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { loadEnv } from '../config/env.js';
import { AVATAR_MAX_BYTES, imageMime, matchesAvatarMime } from './avatarUpload.js';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_MIME = new Set(['video/mp4']);

export interface SignedUpload {
  url: string;
  key: string;
  maxBytes: number;
  mime: string;
  headers?: Record<string, string>;
}

export interface IObjectStore {
  presignPut(key: string, mime: string, maxBytes: number): Promise<SignedUpload>;
  ping(): Promise<boolean>;
}

export class S3ObjectStore implements IObjectStore {
  private client: S3Client;
  private bucket: string;
  constructor() {
    const env = loadEnv();
    if (!env.S3_BUCKET) throw new Error('S3_BUCKET required');
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: env.S3_ACCESS_KEY_ID
        ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY || '' }
        : undefined,
    });
  }

  async presignPut(key: string, mime: string, maxBytes: number, immutable = false): Promise<SignedUpload> {
    const cmd = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mime, IfNoneMatch: immutable ? '*' : undefined });
    const url = await getSignedUrl(this.client, cmd, { expiresIn: 900, signableHeaders: immutable ? new Set(['content-type', 'if-none-match']) : undefined });
    return { url, key, maxBytes, mime, ...(immutable ? { headers: { 'If-None-Match': '*' } } : {}) };
  }

  async ping() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  async verifiedAvatarUrl(key: string) {
    const base = loadEnv().S3_PUBLIC_BASE_URL;
    if (!base || new URL(base).protocol !== 'https:') return null;
    const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!head.ContentLength || head.ContentLength > AVATAR_MAX_BYTES || !matchesAvatarMime(key, head.ContentType)) return null;
    const part = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: 'bytes=0-11', IfMatch: head.ETag }));
    if (!part.Body || imageMime(await part.Body.transformToByteArray()) !== head.ContentType) return null;
    return `${base.replace(/\/+$/, '')}/${key}`;
  }
}

export class DevObjectStore implements IObjectStore {
  async presignPut(key: string, mime: string, maxBytes: number) {
    return { url: `/api/uploads/dev-put?key=${encodeURIComponent(key)}`, key, maxBytes, mime };
  }
  async ping() {
    return true;
  }
}

export function resolveObjectStore(): IObjectStore {
  const env = loadEnv();
  if (env.S3_BUCKET && env.S3_ACCESS_KEY_ID) return new S3ObjectStore();
  return new DevObjectStore();
}

export function validateUploadMime(mime: string, kind: 'image' | 'video') {
  if (kind === 'image' && IMAGE_MIME.has(mime)) return { ok: true, maxBytes: 5 * 1024 * 1024 };
  if (kind === 'video' && VIDEO_MIME.has(mime)) return { ok: true, maxBytes: 100 * 1024 * 1024 };
  return { ok: false, maxBytes: 0 };
}
