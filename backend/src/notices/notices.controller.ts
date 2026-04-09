import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../common/prisma/prisma.service';

@Public()
@Controller('notices')
export class NoticesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = { isPublished: true };

    const [notices, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: Number(limit),
      }),
      this.prisma.notice.count({ where }),
    ]);

    return { notices, total, page: Number(page), limit: Number(limit) };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice || !notice.isPublished) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }
    return notice;
  }
}
