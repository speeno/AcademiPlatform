import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getCFSignedUrl } from '@aws-sdk/cloudfront-signer';
import { EnrollmentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ResolvedStorageConfig, resolveStorageConfig } from '../common/storage/storage-config';

const MAX_CONCURRENT_SESSIONS = 1;
const SESSION_TTL_SECONDS = 30 * 60;
const SIGNED_URL_EXPIRES = 15 * 60;

@Injectable()
export class MediaService {
  private s3: S3Client;
  private readonly storageConfig: ResolvedStorageConfig;
  private aesKeys = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
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

  // S3 업로드용 Presigned URL 발급 (원본 비공개 버킷)
  async getUploadPresignedUrl(lessonId: string, fileName: string, contentType: string) {
    const bucket = this.storageConfig.bucket;
    if (!bucket) {
      throw new BadRequestException(
        '스토리지 버킷이 설정되지 않았습니다. S3_BUCKET 또는 AWS_S3_BUCKET_PRIVATE 환경변수를 설정하세요.',
      );
    }
    const key = `raw/${lessonId}/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    return { presignedUrl, s3Key: key };
  }

  // CloudFront Signed URL 발급 — 수강 검증 후
  async getStreamToken(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        videoAsset: true,
        module: { select: { courseId: true } },
      },
    });
    if (!lesson) throw new NotFoundException('강의를 찾을 수 없습니다.');

    const courseId = lesson.module?.courseId;
    if (courseId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new ForbiddenException('수강 권한이 없습니다.');
      }
    }

    const asset = lesson.videoAsset;
    if (!asset?.hlsPlaylistUrl) throw new BadRequestException('영상 준비 중입니다. 잠시 후 다시 시도해주세요.');

    // 동시 세션 제한
    const activeSessionKey = `video:session:${userId}:${lessonId}`;
    const sessionToken = randomUUID();

    // DB에 세션 기록
    await this.prisma.videoPlaySession.create({
      data: {
        userId,
        lessonId,
        sessionToken,
        expiredAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      },
    });

    // CloudFront Signed URL 생성
    const cfDomain = this.config.get('AWS_CLOUDFRONT_DOMAIN', '');
    const keyPairId = this.config.get('AWS_CLOUDFRONT_KEY_PAIR_ID', '');
    const privateKey = this.config.get('AWS_CLOUDFRONT_PRIVATE_KEY', '');

    let signedUrl = asset.hlsPlaylistUrl;

    if (cfDomain && keyPairId && privateKey) {
      const resource = `https://${cfDomain}/${asset.hlsPlaylistUrl}`;
      signedUrl = await getCFSignedUrl({
        url: resource,
        keyPairId,
        privateKey,
        dateLessThan: new Date(Date.now() + SIGNED_URL_EXPIRES * 1000).toISOString(),
      });
    }

    return { signedUrl, sessionToken, expiresIn: SIGNED_URL_EXPIRES };
  }

  // HLS AES-128 키 서버 — JWT 및 세션 토큰 검증
  async getHlsKey(keyId: string, userId: string, sessionToken: string) {
    const session = await this.prisma.videoPlaySession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.userId !== userId || new Date() > session.expiredAt) {
      throw new ForbiddenException('유효하지 않은 재생 세션입니다.');
    }

    const aesKey = this.aesKeys.get(keyId);
    if (!aesKey) throw new NotFoundException('암호화 키를 찾을 수 없습니다.');

    // 세션 마지막 핑 업데이트
    await this.prisma.videoPlaySession.update({
      where: { id: session.id },
      data: { lastPingAt: new Date() },
    });

    return Buffer.from(aesKey, 'hex');
  }

  // 재생 세션 핑 — 동시 재생 세션 유지
  async pingSession(sessionToken: string, userId: string) {
    const session = await this.prisma.videoPlaySession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.userId !== userId) {
      throw new ForbiddenException('유효하지 않은 세션입니다.');
    }

    if (new Date() > session.expiredAt) {
      throw new ForbiddenException('세션이 만료되었습니다. 다시 재생해주세요.');
    }

    return this.prisma.videoPlaySession.update({
      where: { id: session.id },
      data: {
        lastPingAt: new Date(),
        expiredAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      },
    });
  }

  // AES 키 등록 (MediaConvert 콜백 처리 시 사용)
  registerAesKey(keyId: string, keyHex: string) {
    this.aesKeys.set(keyId, keyHex);
  }
}
