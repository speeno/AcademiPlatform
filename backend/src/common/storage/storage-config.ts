import { ConfigService } from '@nestjs/config';

export type ResolvedStorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function pickFirst(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

export function resolveStorageConfig(config: ConfigService): ResolvedStorageConfig {
  return {
    endpoint: pickFirst(
      config.get<string>('S3_ENDPOINT'),
      config.get<string>('AWS_S3_ENDPOINT'),
    ),
    region: pickFirst(
      config.get<string>('S3_REGION'),
      config.get<string>('AWS_REGION'),
      'auto',
    ),
    bucket: pickFirst(
      config.get<string>('S3_BUCKET'),
      config.get<string>('AWS_S3_BUCKET_PRIVATE'),
    ),
    accessKeyId: pickFirst(
      config.get<string>('S3_ACCESS_KEY'),
      config.get<string>('AWS_ACCESS_KEY_ID'),
    ),
    secretAccessKey: pickFirst(
      config.get<string>('S3_SECRET_KEY'),
      config.get<string>('AWS_SECRET_ACCESS_KEY'),
    ),
  };
}

export function getStorageMissingFields(storage: ResolvedStorageConfig): string[] {
  const missing: string[] = [];
  if (!storage.endpoint) missing.push('endpoint(S3_ENDPOINT 또는 AWS_S3_ENDPOINT)');
  if (!storage.bucket) missing.push('bucket(S3_BUCKET 또는 AWS_S3_BUCKET_PRIVATE)');
  if (!storage.accessKeyId) missing.push('accessKey(S3_ACCESS_KEY 또는 AWS_ACCESS_KEY_ID)');
  if (!storage.secretAccessKey) missing.push('secretKey(S3_SECRET_KEY 또는 AWS_SECRET_ACCESS_KEY)');
  return missing;
}

