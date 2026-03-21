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

    const storage = resolveStorageConfig(this.config);
    const missing = getStorageMissingFields(storage);

    if (missing.length > 0) {
      throw new Error(
        `[storage-preflight] 스토리지 필수 설정 누락: ${missing.join(', ')}`,
      );
    }

    this.logger.log(
      `[storage-preflight] endpoint=${storage.endpoint}, bucket=${storage.bucket}, region=${storage.region}`,
    );
  }
}

