import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateIntroPageDto, CreateIntroSectionDto } from './dto/create-intro-page.dto';
import { IntroPageStatus } from '@prisma/client';

@Injectable()
export class IntroService {
  constructor(private prisma: PrismaService) {}

  async findAllPublished() {
    return this.prisma.introPage.findMany({
      where: { status: IntroPageStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, slug: true, title: true, summary: true, publishedAt: true },
    });
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.introPage.findFirst({
      where: { slug, status: IntroPageStatus.PUBLISHED },
      include: {
        sections: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!page) throw new NotFoundException(`소개 페이지를 찾을 수 없습니다: ${slug}`);
    return page;
  }

  async findAll() {
    return this.prisma.introPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { sections: true } },
      },
    });
  }

  async create(dto: CreateIntroPageDto, userId: string) {
    return this.prisma.introPage.create({
      data: {
        ...dto,
        updatedBy: userId,
        publishedAt: dto.status === IntroPageStatus.PUBLISHED ? new Date() : undefined,
      },
    });
  }

  async update(id: string, dto: Partial<CreateIntroPageDto>, userId: string) {
    await this.findPageById(id);
    return this.prisma.introPage.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
        publishedAt:
          dto.status === IntroPageStatus.PUBLISHED
            ? new Date()
            : undefined,
      },
    });
  }

  async addSection(pageId: string, dto: CreateIntroSectionDto) {
    await this.findPageById(pageId);
    const maxOrder = await this.prisma.introPageSection.aggregate({
      where: { pageId },
      _max: { sortOrder: true },
    });
    return this.prisma.introPageSection.create({
      data: {
        pageId,
        sectionType: dto.sectionType,
        title: dto.title,
        contentJson: dto.contentJson as any,
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
        isVisible: dto.isVisible ?? true,
      },
    });
  }

  async updateSection(sectionId: string, dto: Partial<CreateIntroSectionDto>) {
    return this.prisma.introPageSection.update({
      where: { id: sectionId },
      data: {
        ...dto,
        contentJson: dto.contentJson as any,
      },
    });
  }

  async deleteSection(sectionId: string) {
    return this.prisma.introPageSection.delete({ where: { id: sectionId } });
  }

  async reorderSections(pageId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, idx) =>
        this.prisma.introPageSection.update({
          where: { id },
          data: { sortOrder: idx },
        }),
      ),
    );
    return { success: true };
  }

  private async findPageById(id: string) {
    const page = await this.prisma.introPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('소개 페이지를 찾을 수 없습니다.');
    return page;
  }
}
