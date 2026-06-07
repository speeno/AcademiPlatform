import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { NoticeScope } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
import type { Response } from 'express';
import { NoticeAttachmentService } from './notice-attachment.service';

@Public()
@Controller('notices')
export class NoticesController {
  constructor(
    private prisma: PrismaService,
    private noticeAttachmentService: NoticeAttachmentService,
  ) {}

  @Get()
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('scopeType') scopeType?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const normalizedScope =
      scopeType?.toUpperCase() === NoticeScope.COURSE
        ? NoticeScope.COURSE
        : scopeType?.toUpperCase() === NoticeScope.GLOBAL
          ? NoticeScope.GLOBAL
          : undefined;
    const where = {
      isPublished: true,
      ...(normalizedScope ? { scopeType: normalizedScope } : {}),
    };

    const [notices, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: Number(limit),
        include: {
          attachments: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              fileSize: true,
              sortOrder: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.notice.count({ where }),
    ]);

    return { notices, total, page: Number(page), limit: Number(limit) };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        attachments: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            sortOrder: true,
            createdAt: true,
          },
        },
      },
    });
    if (!notice || !notice.isPublished) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }
    return notice;
  }

  @Get(':id/attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.noticeAttachmentService.getPublicDownloadFile(
      id,
      attachmentId,
    );
    const encodedFileName = encodeURIComponent(file.fileName);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFileName}`,
    );
    res.setHeader('Content-Length', file.fileSize.toString());
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return new StreamableFile(file.buffer);
  }
}
