import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  private readonly s3: S3Client;
  private readonly storageConfig: ResolvedStorageConfig;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private access: CmsAccessService,
  ) {
    this.storageConfig = resolveStorageConfig(this.config);

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

  ensureBucket(message?: string): string {
    const bucket = this.getBucket();
    if (!bucket) {
      throw new BadRequestException(
        message ?? '스토리지 버킷 설정이 누락되었습니다.',
      );
    }
    return bucket;
  }

  async readBuffer(storageKey: string): Promise<Buffer> {
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

  async getSignedDownloadUrl(
    storageKey: string,
    expiresIn = 600,
  ): Promise<string> {
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
