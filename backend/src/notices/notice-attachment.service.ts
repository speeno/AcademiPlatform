import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  ResolvedStorageConfig,
  resolveStorageConfig,
} from '../common/storage/storage-config';

type UploadedNoticeFile = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

const MAX_NOTICE_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_NOTICE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/x-hwp',
  'application/haansofthwp',
  'text/plain',
]);
const EXTENSION_MIME_FALLBACK: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.hwp': 'application/x-hwp',
  '.txt': 'text/plain',
};

function sanitizeUploadedFileName(rawName: string | undefined): string {
  const trimmed = (rawName ?? '').trim();
  if (!trimmed) return 'attachment';
  return trimmed.replace(/[^\w.-]/g, '_').slice(0, 255);
}

@Injectable()
export class NoticeAttachmentService {
  private readonly storageConfig: ResolvedStorageConfig;
  private readonly s3: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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

  async upload(noticeId: string, file: UploadedNoticeFile | undefined) {
    await this.ensureNoticeExists(noticeId);
    const validated = this.validateFile(file);
    const sortOrder = await this.prisma.noticeAttachment.count({
      where: { noticeId },
    });

    let storageKey: string | null = null;
    let localPath: string | null = null;

    if (this.isStorageConfigured()) {
      try {
        const key = `notices/${noticeId}/${Date.now()}_${validated.safeFileName}`;
        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.storageConfig.bucket,
            Key: key,
            Body: validated.buffer,
            ContentType: validated.mimeType,
          }),
        );
        storageKey = key;
      } catch {
        storageKey = null;
      }
    }

    if (!storageKey) {
      const uploadDir = this.resolveLocalUploadDirectory();
      await fs.mkdir(uploadDir, { recursive: true });
      const localFileName = `${Date.now()}_${randomUUID()}_${validated.safeFileName}`;
      const absolutePath = path.join(uploadDir, localFileName);
      await fs.writeFile(absolutePath, validated.buffer);
      localPath = path
        .relative(process.cwd(), absolutePath)
        .replace(/\\/g, '/');
    }

    return this.prisma.noticeAttachment.create({
      data: {
        noticeId,
        storageKey,
        localPath,
        fileName: validated.fileName,
        mimeType: validated.mimeType,
        fileSize: validated.size,
        sortOrder,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        sortOrder: true,
        createdAt: true,
      },
    });
  }

  async remove(noticeId: string, attachmentId: string) {
    const attachment = await this.prisma.noticeAttachment.findFirst({
      where: { id: attachmentId, noticeId },
    });
    if (!attachment) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }

    await this.prisma.noticeAttachment.delete({
      where: { id: attachment.id },
    });
    await this.cleanupAttachmentFile(attachment.storageKey, attachment.localPath);
    return { ok: true };
  }

  async removeAllForNotice(noticeId: string) {
    const attachments = await this.prisma.noticeAttachment.findMany({
      where: { noticeId },
      select: { storageKey: true, localPath: true },
    });

    await this.prisma.noticeAttachment.deleteMany({ where: { noticeId } });
    await Promise.allSettled(
      attachments.map((item) =>
        this.cleanupAttachmentFile(item.storageKey, item.localPath),
      ),
    );
  }

  async listForNotice(noticeId: string) {
    return this.prisma.noticeAttachment.findMany({
      where: { noticeId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        sortOrder: true,
        createdAt: true,
      },
    });
  }

  async getPublicDownloadFile(noticeId: string, attachmentId: string) {
    const attachment = await this.prisma.noticeAttachment.findFirst({
      where: {
        id: attachmentId,
        noticeId,
        notice: { isPublished: true },
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        storageKey: true,
        localPath: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }

    if (attachment.storageKey) {
      if (!this.isStorageConfigured()) {
        throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
      }
      const object = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.storageConfig.bucket,
          Key: attachment.storageKey,
        }),
      );
      if (!object.Body) {
        throw new NotFoundException('첨부파일 본문을 찾을 수 없습니다.');
      }
      const bytes = await object.Body.transformToByteArray();
      return {
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        buffer: Buffer.from(bytes),
      };
    }

    if (!attachment.localPath) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }
    const absolutePath = path.resolve(process.cwd(), attachment.localPath);
    const buffer = await fs.readFile(absolutePath);
    return {
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      buffer,
    };
  }

  private async ensureNoticeExists(noticeId: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id: noticeId },
      select: { id: true },
    });
    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }
  }

  private validateFile(file: UploadedNoticeFile | undefined) {
    if (!file) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('파일 버퍼를 읽지 못했습니다.');
    }

    const fileName = sanitizeUploadedFileName(file.originalname);
    const extension = path.extname(fileName).toLowerCase();
    const rawMimeType = (file.mimetype ?? '').toLowerCase();
    const inferredMimeType =
      ALLOWED_NOTICE_MIME_TYPES.has(rawMimeType) && rawMimeType
        ? rawMimeType
        : rawMimeType === 'application/octet-stream' || !rawMimeType
          ? (EXTENSION_MIME_FALLBACK[extension] ?? '')
          : '';

    if (!inferredMimeType) {
      throw new BadRequestException(
        '지원하지 않는 파일 형식입니다. PDF, Office, HWP, TXT 파일만 첨부할 수 있습니다.',
      );
    }

    const size = Number(file.size ?? file.buffer.length);
    if (size <= 0) {
      throw new BadRequestException('빈 파일은 첨부할 수 없습니다.');
    }
    if (size > MAX_NOTICE_ATTACHMENT_BYTES) {
      throw new BadRequestException('첨부파일은 5MB 이하만 업로드할 수 있습니다.');
    }

    return {
      fileName,
      safeFileName: fileName,
      mimeType: inferredMimeType,
      size,
      buffer: file.buffer,
    };
  }

  private resolveLocalUploadDirectory(): string {
    return path.resolve(process.cwd(), 'static/notices/uploads');
  }

  private isStorageConfigured(): boolean {
    return Boolean(
      this.storageConfig.bucket &&
        this.storageConfig.endpoint &&
        this.storageConfig.accessKeyId &&
        this.storageConfig.secretAccessKey,
    );
  }

  private async cleanupAttachmentFile(
    storageKey: string | null,
    localPath: string | null,
  ) {
    if (storageKey && this.isStorageConfigured()) {
      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: this.storageConfig.bucket,
            Key: storageKey,
          }),
        );
      } catch {
        // noop
      }
      return;
    }

    if (!localPath) return;
    const absolutePath = path.resolve(process.cwd(), localPath);
    try {
      await fs.unlink(absolutePath);
    } catch {
      // noop
    }
  }
}
