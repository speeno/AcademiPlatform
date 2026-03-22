import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getStorageMissingFields, resolveStorageConfig } from './storage-config';

@Injectable()
export class StoragePreflightService implements OnModuleInit {
  private readonly logger = new Logger(StoragePreflightService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const nodeEnv = (this.config.get<string>('NODE_ENV') ?? 'development').toLowerCase();
    if (nodeEnv === 'test') return;
    const strictByEnv = nodeEnv === 'production';
    const strictByFlag =
      (this.config.get<string>('STORAGE_PREFLIGHT_STRICT') ?? 'false').toLowerCase() === 'true';
    const isStrict = strictByEnv || strictByFlag;

    const storage = resolveStorageConfig(this.config);
    const missing = getStorageMissingFields(storage);

    if (missing.length > 0) {
      if (isStrict) {
        throw new Error(
          `[storage-preflight] 스토리지 필수 설정 누락: ${missing.join(', ')}`,
        );
      }
      this.logger.warn(
        `[storage-preflight] (non-strict) 스토리지 설정 일부 누락: ${missing.join(', ')}`,
      );
      return;
    }

    this.logger.log(
      `[storage-preflight] endpoint=${storage.endpoint}, bucket=${storage.bucket}, region=${storage.region}`,
    );
  }
}

