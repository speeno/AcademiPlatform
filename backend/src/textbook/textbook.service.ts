import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { TextbookGrantedBy, TextbookStatus } from '@prisma/client';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs/promises';
import * as path from 'path';

const VIEWER_TOKEN_TTL = 15 * 60; // 15분
const WATERMARK_CACHE = new Map<string, { buffer: Buffer; expiredAt: Date }>();

@Injectable()
export class TextbookService {
  private s3: S3Client;
  private readonly isProduction: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const endpoint = this.config.get<string>('S3_ENDPOINT')?.trim();
    const accessKeyId =
      this.config.get<string>('S3_ACCESS_KEY') ||
      this.config.get<string>('AWS_ACCESS_KEY_ID') ||
      '';
    const secretAccessKey =
      this.config.get<string>('S3_SECRET_KEY') ||
      this.config.get<string>('AWS_SECRET_ACCESS_KEY') ||
      '';
    const region =
      this.config.get<string>('S3_REGION') ||
      this.config.get<string>('AWS_REGION') ||
      'auto';

    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: !!endpoint,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
    this.isProduction = (this.config.get<string>('NODE_ENV') ?? '').toLowerCase() === 'production';
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
            id: true, title: true, description: true, coverImageUrl: true,
            totalPages: true, price: true, status: true,
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
        id: true, title: true, description: true, coverImageUrl: true,
        totalPages: true, price: true, isStandalone: true,
      },
    });
    if (!textbook) throw new NotFoundException('교재를 찾을 수 없습니다.');
    return textbook;
  }

  // 15분 뷰어 토큰 발급 — 접근 권한 검증
  async getViewerToken(textbookId: string, userId: string) {
    await this.verifyAccess(textbookId, userId);

    const secret = this.config.get('JWT_SECRET', 'changeme');
    const token = jwt.sign(
      { sub: userId, textbookId, type: 'textbook-viewer' },
      secret,
      { expiresIn: VIEWER_TOKEN_TTL },
    );

    return { viewerToken: token, expiresIn: VIEWER_TOKEN_TTL };
  }

  // PDF 스트리밍 — 서버 사이드 동적 워터마킹
  async streamPdf(textbookId: string, viewerToken: string, userId: string): Promise<Buffer> {
    // 토큰 검증
    const secret = this.config.get('JWT_SECRET', 'changeme');
    let payload: any;
    try {
      payload = jwt.verify(viewerToken, secret);
    } catch {
      throw new ForbiddenException('유효하지 않은 뷰어 토큰입니다.');
    }

    if (payload.textbookId !== textbookId || payload.sub !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    const textbook = await this.prisma.textbook.findUnique({ where: { id: textbookId } });
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

    // 원본 PDF 읽기
    // - 로컬 개발: localPath 우선 (로컬 폴더 기반)
    // - 배포 환경: 객체 스토리지(R2/S3) 우선
    let originalPdf: Buffer;
    if (!this.isProduction && textbook.localPath) {
      const absPath = path.resolve(textbook.localPath);
      originalPdf = await fs.readFile(absPath);
    } else if (textbook.s3Key) {
      const bucket = this.getStorageBucket();
      const command = new GetObjectCommand({ Bucket: bucket, Key: textbook.s3Key });
      const s3Response = await this.s3.send(command);

      const chunks: Buffer[] = [];
      for await (const chunk of s3Response.Body as Readable) {
        chunks.push(Buffer.from(chunk));
      }
      originalPdf = Buffer.concat(chunks);
    } else if (textbook.localPath) {
      // 운영 중이라도 데이터 정합성 문제로 localPath만 남은 경우를 대비한 안전 fallback
      const absPath = path.resolve(textbook.localPath);
      originalPdf = await fs.readFile(absPath);
    } else {
      throw new NotFoundException('교재 파일 원본을 찾을 수 없습니다.');
    }

    // 사용자 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const watermarkText = `${user?.name ?? '익명'} | ${user?.email?.slice(0, 4) ?? '****'}@** | ${new Date().toLocaleDateString('ko-KR')}`;

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
  async grantAccessAfterPurchase(textbookId: string, userId: string, paymentId: string) {
    return this.prisma.textbookAccess.upsert({
      where: { userId_textbookId: { userId, textbookId } },
      create: {
        userId, textbookId,
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
        userId, textbookId,
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
    const key = `textbooks/${Date.now()}_${fileName}`;
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { presignedUrl, s3Key: key };
  }

  async listAdminTextbooks() {
    return this.prisma.textbook.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // 관리자: 교재 등록
  async createTextbook(data: any, adminId: string) {
    return this.prisma.textbook.create({
      data: { ...data, createdById: adminId },
    });
  }

  // 관리자: 교재 수정
  async updateTextbook(id: string, data: any) {
    return this.prisma.textbook.update({ where: { id }, data });
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
    const bucket =
      this.config.get<string>('S3_BUCKET') ||
      this.config.get<string>('AWS_S3_BUCKET_PRIVATE') ||
      '';

    if (!bucket) {
      throw new BadRequestException(
        '스토리지 버킷이 설정되지 않았습니다. S3_BUCKET 또는 AWS_S3_BUCKET_PRIVATE 환경변수를 설정하세요.',
      );
    }

    return bucket;
  }
}
