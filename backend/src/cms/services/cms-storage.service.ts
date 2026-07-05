import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ResolvedStorageConfig,
  resolveStorageConfig,
} from '../../common/storage/storage-config';
import { CmsAccessService } from './cms-access.service';

/**
 * CMS 스토리지(S3 호환) I/O 책임.
 * - 업로드 presigned URL 발급, 객체 다운로드 버퍼 조회, 객체 업로드.
 * - S3 클라이언트 생성/구성 일원화로 다른 CMS 협력자가 직접 SDK 의존하지 않도록 한다.
 */
@Injectable()
export class CmsStorageService {
  private readonly logger = new Logger(CmsStorageService.name);
  private readonly s3: S3Client;
  private readonly storageConfig: ResolvedStorageConfig;
  /** 로컬 폴백 저장소 루트. storageKey 는 이 디렉터리 하위 상대경로(`cms/...`)로 매핑된다. */
  private readonly localRoot: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private access: CmsAccessService,
  ) {
    this.storageConfig = resolveStorageConfig(this.config);
    this.localRoot = path.resolve(
      this.config.get<string>('CMS_STORAGE_PATH')?.trim() ||
        path.join(process.cwd(), 'static'),
    );

    this.s3 = new S3Client({
      region: this.storageConfig.region,
      endpoint: this.storageConfig.endpoint,
      forcePathStyle: !!this.storageConfig.endpoint,
      credentials:
        this.storageConfig.accessKeyId && this.storageConfig.secretAccessKey
          ? {
              accessKeyId: this.storageConfig.accessKeyId,
              secretAccessKey: this.storageConfig.secretAccessKey,
            }
          : undefined,
    });
  }

  getBucket(): string {
    return this.storageConfig.bucket;
  }

  /**
   * S3(호환) 스토리지가 사용 가능한지 여부.
   * 버킷·자격증명이 모두 있어야 원격 모드로 동작하며, 아니면 로컬 디스크 폴백을 쓴다.
   */
  isRemoteConfigured(): boolean {
    return !!(
      this.storageConfig.bucket &&
      this.storageConfig.accessKeyId &&
      this.storageConfig.secretAccessKey
    );
  }

  ensureBucket(message?: string): string {
    const bucket = this.getBucket();
    if (!bucket) {
      throw new BadRequestException(
        message ?? '스토리지 버킷 설정이 누락되었습니다.',
      );
    }
    return bucket;
  }

  /** storageKey(`cms/...`) 를 로컬 절대경로로 변환하며 경로 이탈을 방지한다. */
  private resolveLocalPath(storageKey: string): string {
    const normalized = path
      .normalize(storageKey)
      .replace(/^(\.\.(\/|\\|$))+/, '');
    const full = path.resolve(this.localRoot, normalized);
    if (full !== this.localRoot && !full.startsWith(this.localRoot + path.sep)) {
      throw new BadRequestException('허용되지 않는 스토리지 경로입니다.');
    }
    return full;
  }

  async readBuffer(storageKey: string): Promise<Buffer> {
    if (!this.isRemoteConfigured()) {
      try {
        return await fs.readFile(this.resolveLocalPath(storageKey));
      } catch {
        throw new NotFoundException(
          '로컬 스토리지에서 파일을 찾을 수 없습니다.',
        );
      }
    }
    const bucket = this.ensureBucket();
    const object = await this.s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
    );
    if (!object.Body) {
      throw new NotFoundException('스토리지 파일 본문을 찾을 수 없습니다.');
    }
    const bytes = await object.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.isRemoteConfigured()) {
      // 로컬 디스크 폴백은 개발 편의용이다. 운영에서는 StoragePreflightService 가
      // 기동을 차단하므로 이 경로에 도달하면 안 되지만, 도달했다면 유실 위험을 알린다.
      this.logger.warn(
        `[cms-storage] 원격 스토리지 미설정 — 로컬 디스크에 기록합니다(재배포 시 유실 위험) key=${key}`,
      );
      const full = this.resolveLocalPath(key);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, buffer);
      return key;
    }
    const bucket = this.ensureBucket();
    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return key;
  }

  /** 객체 삭제(베스트에포트). 원격/로컬 모두 지원. */
  async deleteObject(storageKey: string): Promise<void> {
    if (!storageKey) return;
    try {
      if (!this.isRemoteConfigured()) {
        await fs.unlink(this.resolveLocalPath(storageKey));
        return;
      }
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.ensureBucket(),
          Key: storageKey,
        }),
      );
    } catch (error) {
      this.logger.warn(
        `스토리지 객체 삭제 실패 key=${storageKey}: ${String(error)}`,
      );
    }
  }

  /**
   * 서명 다운로드 URL. 로컬 폴백 모드에서는 서명 URL이 없으므로 null 을 반환하며,
   * 호출 측은 인증 스트리밍 엔드포인트(`/cms/assets/:id/file`)로 대체한다.
   */
  async getSignedDownloadUrl(
    storageKey: string,
    expiresIn = 600,
  ): Promise<string | null> {
    if (!this.isRemoteConfigured()) return null;
    const bucket = this.ensureBucket();
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
      { expiresIn },
    );
  }

  async getUploadUrl(
    userId: string,
    payload: {
      courseId: string;
      lessonId: string;
      fileName: string;
      contentType: string;
    },
  ) {
    await this.access.ensureCanEditCourse(userId, payload.courseId);
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: payload.lessonId },
      select: { id: true, courseId: true },
    });
    if (!lesson || lesson.courseId !== payload.courseId) {
      throw new BadRequestException('강좌와 레슨 매칭이 올바르지 않습니다.');
    }

    const bucket = this.ensureBucket(
      '스토리지 버킷이 설정되지 않았습니다. S3_BUCKET 또는 AWS_S3_BUCKET_PRIVATE 환경변수를 설정하세요.',
    );

    const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `cms/${payload.courseId}/${payload.lessonId}/${Date.now()}_${safeFileName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: payload.contentType,
    });
    const presignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });
    return { presignedUrl, storageKey: key };
  }
}
