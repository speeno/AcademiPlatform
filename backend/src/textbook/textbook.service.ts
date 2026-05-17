import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { Logger } from '@nestjs/common';
import {
  PaymentTarget,
  TextbookGrantedBy,
  TextbookStatus,
} from '@prisma/client';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ResolvedStorageConfig,
  resolveStorageConfig,
} from '../common/storage/storage-config';

const VIEWER_TOKEN_TTL = 15 * 60; // 15분
const WATERMARK_CACHE = new Map<string, { buffer: Buffer; expiredAt: Date }>();
type UploadPdfInput =
  | { originalname?: string; mimetype?: string; buffer?: Buffer }
  | undefined;
type ViewerTokenPayload = { sub: string; textbookId: string; type: string };
type TextbookPayload = {
  title?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  s3Key?: string | null;
  localPath?: string | null;
  totalPages?: number | null;
  price?: number;
  currency?: string;
  basePrice?: number;
  salePrice?: number | null;
  discountType?: 'NONE' | 'PERCENT' | 'FIXED';
  discountValue?: number;
  priceValidFrom?: Date | string | null;
  priceValidUntil?: Date | string | null;
  pricePolicyVersion?: number;
  isStandalone?: boolean;
  status?: TextbookStatus;
};

@Injectable()
export class TextbookService {
  private readonly logger = new Logger(TextbookService.name);
  private s3: S3Client;
  private readonly storageConfig: ResolvedStorageConfig;
  private readonly isProduction: boolean;

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
    this.isProduction =
      (this.config.get<string>('NODE_ENV') ?? '').toLowerCase() ===
      'production';
  }

  async findAll(userId: string) {
    const accesses = await this.prisma.textbookAccess.findMany({
      where: {
        userId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        textbook: {
          select: {
            id: true,
            title: true,
            description: true,
            coverImageUrl: true,
            totalPages: true,
            price: true,
            status: true,
          },
        },
      },
    });
    return accesses
      .map((a) => a.textbook)
      .filter((t) => t?.status === TextbookStatus.PUBLISHED);
  }

  async findStore(userId: string) {
    const [books, accesses] = await Promise.all([
      this.prisma.textbook.findMany({
        where: { status: TextbookStatus.PUBLISHED, isStandalone: true },
        select: {
          id: true,
          title: true,
          description: true,
          coverImageUrl: true,
          totalPages: true,
          price: true,
          currency: true,
          basePrice: true,
          salePrice: true,
          discountType: true,
          discountValue: true,
          priceValidFrom: true,
          priceValidUntil: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.textbookAccess.findMany({
        where: { userId, revokedAt: null },
        select: { textbookId: true },
      }),
    ]);
    const ownedSet = new Set(accesses.map((a) => a.textbookId));
    return books.map((book) => ({ ...book, hasAccess: ownedSet.has(book.id) }));
  }

  async findById(textbookId: string) {
    const textbook = await this.prisma.textbook.findUnique({
      where: { id: textbookId, status: TextbookStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        description: true,
        coverImageUrl: true,
        totalPages: true,
        price: true,
        isStandalone: true,
      },
    });
    if (!textbook) throw new NotFoundException('교재를 찾을 수 없습니다.');
    return textbook;
  }

  // 15분 뷰어 토큰 발급 — 접근 권한 검증
  async getViewerToken(textbookId: string, userId: string) {
    await this.verifyAccess(textbookId, userId);

    const secret = this.resolveViewerTokenSecret();
    const token = jwt.sign(
      { sub: userId, textbookId, type: 'textbook-viewer' },
      secret,
      { expiresIn: VIEWER_TOKEN_TTL },
    );

    return { viewerToken: token, expiresIn: VIEWER_TOKEN_TTL };
  }

  // PDF 스트리밍 — 서버 사이드 동적 워터마킹
  async streamPdf(
    textbookId: string,
    viewerToken: string,
    userId: string,
  ): Promise<Buffer> {
    // 토큰 검증
    const secret = this.resolveViewerTokenSecret();
    let payload: ViewerTokenPayload;
    try {
      const verified = jwt.verify(viewerToken, secret);
      if (!verified || typeof verified !== 'object') {
        throw new Error('invalid token payload');
      }
      payload = verified as ViewerTokenPayload;
    } catch {
      throw new ForbiddenException('유효하지 않은 뷰어 토큰입니다.');
    }

    if (payload.textbookId !== textbookId || payload.sub !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    const textbook = await this.prisma.textbook.findUnique({
      where: { id: textbookId },
    });
    if (!textbook) throw new NotFoundException('교재를 찾을 수 없습니다.');

    if (!textbook.s3Key && !textbook.localPath) {
      throw new NotFoundException('교재 파일이 등록되지 않았습니다.');
    }

    // 캐시 확인 (사용자별 워터마킹이므로 userId 포함)
    const cacheKey = `${textbookId}:${userId}`;
    const cached = WATERMARK_CACHE.get(cacheKey);
    if (cached && new Date() < cached.expiredAt) {
      return cached.buffer;
    }

    const originalPdf = await this.loadOriginalPdfBuffer(
      textbook.s3Key,
      textbook.localPath,
    );

    // 사용자 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const watermarkText = this.buildWatermarkText(userId, user?.email ?? '');

    // pdf-lib으로 워터마킹 삽입
    const pdfDoc = await PDFDocument.load(originalPdf);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: width * 0.1,
        y: height * 0.5,
        size: 16,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.2,
        rotate: degrees(45),
      });
    }

    const watermarkedBytes = await pdfDoc.save();
    const buffer = Buffer.from(watermarkedBytes);

    // 5분 캐시
    WATERMARK_CACHE.set(cacheKey, {
      buffer,
      expiredAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // 열람 로그 기록
    await this.prisma.textbookViewLog.create({
      data: { userId, textbookId, pageNumber: 1 },
    });

    return buffer;
  }

  // 교재 개별 구매 요청 (payments 모듈 연동)
  async requestPurchase(textbookId: string, userId: string) {
    const textbook = await this.findById(textbookId);
    if (!textbook.isStandalone || textbook.price === 0) {
      throw new BadRequestException('구매 가능한 교재가 아닙니다.');
    }

    const existing = await this.prisma.textbookAccess.findUnique({
      where: { userId_textbookId: { userId, textbookId } },
    });
    if (existing && !existing.revokedAt) {
      throw new BadRequestException('이미 접근 권한이 있습니다.');
    }

    return { textbookId, price: textbook.price, title: textbook.title, userId };
  }

  // 구매 완료 후 접근 권한 자동 생성 (payments 서비스에서 호출)
  async grantAccessAfterPurchase(
    textbookId: string,
    userId: string,
    paymentId: string,
  ) {
    return this.prisma.textbookAccess.upsert({
      where: { userId_textbookId: { userId, textbookId } },
      create: {
        userId,
        textbookId,
        grantedBy: TextbookGrantedBy.PURCHASE,
        sourceId: paymentId,
      },
      update: { revokedAt: null, sourceId: paymentId },
    });
  }

  // 관리자: 수동 권한 부여
  async grantAccess(textbookId: string, userId: string, adminId: string) {
    return this.prisma.textbookAccess.upsert({
      where: { userId_textbookId: { userId, textbookId } },
      create: {
        userId,
        textbookId,
        grantedBy: TextbookGrantedBy.ADMIN,
        sourceId: adminId,
      },
      update: { revokedAt: null, sourceId: adminId },
    });
  }

  // 관리자: 권한 회수
  async revokeAccess(textbookId: string, userId: string) {
    return this.prisma.textbookAccess.updateMany({
      where: { textbookId, userId },
      data: { revokedAt: new Date() },
    });
  }

  // 관리자: 열람 이력 조회
  async getViewLogs(textbookId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.textbookViewLog.findMany({
        where: { textbookId },
        orderBy: { viewedAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.textbookViewLog.count({ where: { textbookId } }),
    ]);
    return { logs, total, page, limit };
  }

  // 관리자: S3 업로드 Presigned URL 발급
  async getUploadPresignedUrl(fileName: string, contentType: string) {
    const bucket = this.getStorageBucket();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `textbooks/${Date.now()}_${safeFileName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    const presignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });
    return { presignedUrl, s3Key: key };
  }

  async uploadLocalPdf(file: UploadPdfInput) {
    if (!file) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    const mimeType = (file.mimetype ?? '').toLowerCase();
    const fileName = file.originalname ?? 'textbook.pdf';
    const isPdf =
      mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new BadRequestException('PDF 파일만 업로드할 수 있습니다.');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('파일 버퍼를 읽지 못했습니다.');
    }

    const uploadsDir = this.resolveTextbookStoragePath();
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const localFileName = `${Date.now()}_${randomUUID()}_${safeFileName}`;
    const absolutePath = path.join(uploadsDir, localFileName);
    await fs.writeFile(absolutePath, file.buffer);

    return { localPath: absolutePath };
  }

  async uploadPdfToStorage(file: UploadPdfInput) {
    if (!file) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    const mimeType = (file.mimetype ?? '').toLowerCase();
    const fileName = file.originalname ?? 'textbook.pdf';
    const isPdf =
      mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new BadRequestException('PDF 파일만 업로드할 수 있습니다.');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('파일 버퍼를 읽지 못했습니다.');
    }

    const bucket = this.getStorageBucket();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `textbooks/${Date.now()}_${safeFileName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: file.mimetype || 'application/pdf',
      Body: file.buffer,
    });
    await this.s3.send(command);

    return { s3Key };
  }

  async listAdminTextbooks() {
    return this.prisma.textbook.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // 관리자: 교재 등록
  async createTextbook(data: unknown, adminId: string) {
    const payload = data as TextbookPayload;
    const title = payload.title?.trim();
    if (!title) {
      throw new BadRequestException('교재명(title)은 필수입니다.');
    }

    return this.prisma.textbook.create({
      data: {
        title,
        description: payload.description ?? undefined,
        coverImageUrl: payload.coverImageUrl ?? undefined,
        s3Key: payload.s3Key ?? undefined,
        localPath: payload.localPath ?? undefined,
        totalPages: payload.totalPages ?? undefined,
        price: payload.price ?? 0,
        currency: payload.currency ?? 'KRW',
        basePrice: payload.basePrice ?? 0,
        salePrice: payload.salePrice ?? undefined,
        discountType: payload.discountType ?? 'NONE',
        discountValue: payload.discountValue ?? 0,
        priceValidFrom: payload.priceValidFrom
          ? new Date(payload.priceValidFrom)
          : undefined,
        priceValidUntil: payload.priceValidUntil
          ? new Date(payload.priceValidUntil)
          : undefined,
        pricePolicyVersion: payload.pricePolicyVersion ?? 1,
        isStandalone: payload.isStandalone ?? false,
        status: payload.status ?? TextbookStatus.DRAFT,
        createdById: adminId,
      },
    });
  }

  // 관리자: 교재 수정
  async updateTextbook(id: string, data: unknown) {
    const payload = data as TextbookPayload;
    return this.prisma.textbook.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description }
          : {}),
        ...(payload.coverImageUrl !== undefined
          ? { coverImageUrl: payload.coverImageUrl }
          : {}),
        ...(payload.s3Key !== undefined ? { s3Key: payload.s3Key } : {}),
        ...(payload.localPath !== undefined
          ? { localPath: payload.localPath }
          : {}),
        ...(payload.totalPages !== undefined
          ? { totalPages: payload.totalPages }
          : {}),
        ...(payload.price !== undefined ? { price: payload.price } : {}),
        ...(payload.currency !== undefined
          ? { currency: payload.currency }
          : {}),
        ...(payload.basePrice !== undefined
          ? { basePrice: payload.basePrice }
          : {}),
        ...(payload.salePrice !== undefined
          ? { salePrice: payload.salePrice }
          : {}),
        ...(payload.discountType !== undefined
          ? { discountType: payload.discountType }
          : {}),
        ...(payload.discountValue !== undefined
          ? { discountValue: payload.discountValue }
          : {}),
        ...(payload.priceValidFrom !== undefined
          ? {
              priceValidFrom: payload.priceValidFrom
                ? new Date(payload.priceValidFrom)
                : null,
            }
          : {}),
        ...(payload.priceValidUntil !== undefined
          ? {
              priceValidUntil: payload.priceValidUntil
                ? new Date(payload.priceValidUntil)
                : null,
            }
          : {}),
        ...(payload.pricePolicyVersion !== undefined
          ? { pricePolicyVersion: payload.pricePolicyVersion }
          : {}),
        ...(payload.isStandalone !== undefined
          ? { isStandalone: payload.isStandalone }
          : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
    });
  }

  async deleteTextbook(id: string) {
    const textbook = await this.prisma.$transaction(async (tx) => {
      const target = await tx.textbook.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          status: true,
          s3Key: true,
          localPath: true,
        },
      });
      if (!target) {
        throw new NotFoundException('삭제할 교재를 찾을 수 없습니다.');
      }
      if (target.status === TextbookStatus.PUBLISHED) {
        throw new BadRequestException(
          '배포(PUBLISHED) 상태 교재는 삭제할 수 없습니다.',
        );
      }

      const [accessCount, paymentCount] = await Promise.all([
        tx.textbookAccess.count({
          where: { textbookId: id },
        }),
        tx.payment.count({
          where: {
            targetType: PaymentTarget.TEXTBOOK,
            targetId: id,
          },
        }),
      ]);

      if (accessCount > 0 || paymentCount > 0) {
        throw new BadRequestException(
          '판매 또는 권한 이력이 있는 교재는 삭제할 수 없습니다.',
        );
      }

      await tx.textbookViewLog.deleteMany({
        where: { textbookId: id },
      });
      await tx.courseTextbook.deleteMany({
        where: { textbookId: id },
      });
      await tx.textbook.delete({
        where: { id },
      });

      return target;
    });

    const warnings: string[] = [];
    const s3Warning = await this.deleteStoredS3Object(textbook.s3Key);
    if (s3Warning) warnings.push(s3Warning);

    const localWarning = await this.deleteStoredLocalFile(textbook.localPath);
    if (localWarning) warnings.push(localWarning);

    return {
      deleted: true,
      textbookId: textbook.id,
      title: textbook.title,
      warnings,
    };
  }

  /**
   * 뷰어 토큰용 시크릿을 결정한다.
   * - 1순위: `VIEWER_TOKEN_SECRET` (뷰어 전용 분리 키, 권장)
   * - 2순위: `JWT_SECRET` (단일 키 운영 호환)
   * - 두 값 모두 없으면 즉시 예외 — 'changeme' 등의 약한 기본값을 절대 사용하지 않는다.
   */
  private resolveViewerTokenSecret(): string {
    const viewerSecret = this.config.get<string>('VIEWER_TOKEN_SECRET')?.trim();
    if (viewerSecret) return viewerSecret;
    const jwtSecret = this.config.get<string>('JWT_SECRET')?.trim();
    if (jwtSecret) return jwtSecret;
    throw new Error(
      'VIEWER_TOKEN_SECRET 또는 JWT_SECRET 환경변수가 설정되지 않았습니다.',
    );
  }

  private async verifyAccess(textbookId: string, userId: string) {
    // 관리자(SUPER_ADMIN, OPERATOR)는 모든 교재 열람 가능
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'OPERATOR') {
      return;
    }

    const access = await this.prisma.textbookAccess.findUnique({
      where: { userId_textbookId: { userId, textbookId } },
    });

    if (!access || access.revokedAt) {
      throw new ForbiddenException('교재 접근 권한이 없습니다.');
    }

    if (access.expiresAt && new Date() > access.expiresAt) {
      throw new ForbiddenException('교재 접근 권한이 만료되었습니다.');
    }
  }

  private getStorageBucket(): string {
    const bucket = this.storageConfig.bucket;

    if (!bucket) {
      throw new BadRequestException(
        '스토리지 버킷이 설정되지 않았습니다. S3_BUCKET 또는 AWS_S3_BUCKET_PRIVATE 환경변수를 설정하세요.',
      );
    }

    return bucket;
  }

  private buildWatermarkText(userId: string, email: string): string {
    const emailPrefix = (email.split('@')[0] || 'unknown').slice(0, 12);
    const raw = `uid:${userId.slice(0, 12)} | email:${emailPrefix} | at:${new Date().toISOString()}`;
    return raw.replace(/[^\x20-\x7E]/g, '?');
  }

  private resolveTextbookStoragePath(): string {
    const configured = (
      this.config.get<string>('TEXTBOOK_STORAGE_PATH') ?? ''
    ).trim();
    if (configured) {
      return path.resolve(configured, 'uploads');
    }
    return path.resolve(process.cwd(), 'static/textbooks/uploads');
  }

  private resolveLocalCandidatePaths(localPathValue: string): string[] {
    const candidates = new Set<string>();
    const trimmed = localPathValue.trim();
    if (!trimmed) return [];

    if (path.isAbsolute(trimmed)) {
      candidates.add(trimmed);
      return Array.from(candidates);
    }

    candidates.add(path.resolve(trimmed));
    candidates.add(path.resolve(process.cwd(), trimmed));

    const storageBase = (
      this.config.get<string>('TEXTBOOK_STORAGE_PATH') ?? ''
    ).trim();
    if (storageBase) {
      candidates.add(path.resolve(storageBase, trimmed));
      candidates.add(
        path.resolve(storageBase, 'uploads', path.basename(trimmed)),
      );
    }

    return Array.from(candidates);
  }

  private async loadFromLocal(localPathValue?: string | null): Promise<Buffer> {
    if (!localPathValue) throw new Error('localPath가 비어 있습니다.');

    const candidates = this.resolveLocalCandidatePaths(localPathValue);
    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        return await fs.readFile(candidate);
      } catch (err: unknown) {
        lastError = err;
      }
    }

    const reason =
      lastError instanceof Error
        ? lastError.message
        : '로컬 파일을 찾지 못했습니다.';
    throw new Error(`로컬 교재 파일 로드 실패(${localPathValue}): ${reason}`);
  }

  private async loadFromS3(s3Key?: string | null): Promise<Buffer> {
    if (!s3Key) throw new Error('s3Key가 비어 있습니다.');
    const bucket = this.getStorageBucket();
    const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
    const s3Response = await this.s3.send(command);

    if (!s3Response.Body) {
      throw new Error(`스토리지 응답 바디가 비어 있습니다. key=${s3Key}`);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of s3Response.Body as Readable) {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array),
      );
    }
    return Buffer.concat(chunks);
  }

  private async loadOriginalPdfBuffer(
    s3Key?: string | null,
    localPathValue?: string | null,
  ): Promise<Buffer> {
    const errors: string[] = [];
    const pushError = (source: 'local' | 's3', err: unknown) => {
      const reason = err instanceof Error ? err.message : String(err);
      errors.push(`${source}: ${reason}`);
    };

    if (!this.isProduction) {
      if (localPathValue) {
        try {
          return await this.loadFromLocal(localPathValue);
        } catch (err: unknown) {
          pushError('local', err);
        }
      }
      if (s3Key) {
        try {
          return await this.loadFromS3(s3Key);
        } catch (err: unknown) {
          pushError('s3', err);
        }
      }
    } else {
      if (s3Key) {
        try {
          return await this.loadFromS3(s3Key);
        } catch (err: unknown) {
          pushError('s3', err);
        }
      }
      if (localPathValue) {
        try {
          return await this.loadFromLocal(localPathValue);
        } catch (err: unknown) {
          pushError('local', err);
        }
      }
    }

    throw new NotFoundException(
      `교재 파일 원본을 찾을 수 없습니다. ${errors.join(' | ')}`.trim(),
    );
  }

  private async deleteStoredS3Object(
    s3Key?: string | null,
  ): Promise<string | null> {
    if (!s3Key) return null;

    try {
      const bucket = this.getStorageBucket();
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: s3Key,
        }),
      );
      return null;
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `교재 스토리지 파일 삭제 실패 key=${s3Key}, reason=${reason}`,
      );
      return `스토리지 파일 삭제 실패(${s3Key}): ${reason}`;
    }
  }

  private async deleteStoredLocalFile(
    localPathValue?: string | null,
  ): Promise<string | null> {
    if (!localPathValue) return null;

    const candidates = this.resolveLocalCandidatePaths(localPathValue);
    if (candidates.length === 0) return null;

    let seenError: string | null = null;
    for (const candidate of candidates) {
      try {
        await fs.unlink(candidate);
        return null;
      } catch (err: unknown) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: string }).code === 'ENOENT'
        ) {
          continue;
        }
        seenError = err instanceof Error ? err.message : String(err);
      }
    }

    if (!seenError) return null;
    this.logger.warn(
      `교재 로컬 파일 삭제 실패 path=${localPathValue}, reason=${seenError}`,
    );
    return `로컬 파일 삭제 실패(${localPathValue}): ${seenError}`;
  }
}
