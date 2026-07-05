import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getStorageMissingFields,
  resolveStorageConfig,
} from './storage-config';

@Injectable()
export class StoragePreflightService implements OnModuleInit {
  private readonly logger = new Logger(StoragePreflightService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const nodeEnv = (
      this.config.get<string>('NODE_ENV') ?? 'development'
    ).toLowerCase();
    if (nodeEnv === 'test') return;

    // 운영에서는 원격 스토리지 미설정 시 기본 차단한다: 로컬 디스크 폴백은 Render의
    // 휘발성 파일시스템에 CMS 콘텐츠를 쓰므로 재배포 때 파일이 유실되고 DB의
    // ContentAsset.storageKey 는 죽은 참조가 된다. STORAGE_PREFLIGHT_STRICT 를
    // 명시적으로 지정하면(예: 초기 배포) 그 값이 우선한다.
    const strictFlag = this.config
      .get<string>('STORAGE_PREFLIGHT_STRICT')
      ?.trim()
      .toLowerCase();
    const isStrict = strictFlag ? strictFlag === 'true' : nodeEnv === 'production';

    const storage = resolveStorageConfig(this.config);
    const missing = getStorageMissingFields(storage);

    if (missing.length > 0) {
      if (isStrict) {
        throw new Error(
          `[storage-preflight] 스토리지 필수 설정 누락 — 운영에서는 로컬 디스크 폴백 시 ` +
            `CMS 콘텐츠가 재배포마다 유실됩니다. S3/R2 환경변수를 설정하거나 ` +
            `STORAGE_PREFLIGHT_STRICT=false 로 명시적 완화하세요: ${missing.join(', ')}`,
        );
      }
      this.logger.warn(
        `[storage-preflight] (non-strict) 스토리지 설정 일부 누락 — 로컬 디스크 폴백 사용: ${missing.join(', ')}`,
      );
      return;
    }

    this.logger.log(
      `[storage-preflight] endpoint=${storage.endpoint}, bucket=${storage.bucket}, region=${storage.region}`,
    );
  }
}
