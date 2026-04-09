import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

const ROLE_LEVEL: Record<UserRole, number> = {
  USER: 1,
  INSTRUCTOR: 2,
  OPERATOR: 3,
  SUPER_ADMIN: 4,
};

@Injectable()
export class InstructorPostsService {
  constructor(private prisma: PrismaService) {}

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { isPublished: true };

    const [posts, total] = await Promise.all([
      this.prisma.instructorPost.findMany({
        where,
        orderBy: [{ isPinned: 'desc' as const }, { createdAt: 'desc' as const }],
        skip,
        take: limit,
        include: { author: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.instructorPost.count({ where }),
    ]);

    return { posts, total, page, limit };
  }

  async findById(id: string) {
    const post = await this.prisma.instructorPost.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    return post;
  }

  async create(authorId: string, data: { title: string; content: string; isPinned?: boolean }) {
    return this.prisma.instructorPost.create({
      data: {
        authorId,
        title: data.title,
        content: data.content,
        isPinned: data.isPinned ?? false,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    data: { title?: string; content?: string; isPinned?: boolean; isPublished?: boolean },
  ) {
    const post = await this.findById(id);
    this.assertOwnerOrOperator(post.authorId, userId, userRole);

    return this.prisma.instructorPost.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const post = await this.findById(id);
    this.assertOwnerOrOperator(post.authorId, userId, userRole);

    return this.prisma.instructorPost.delete({ where: { id } });
  }

  private assertOwnerOrOperator(authorId: string, userId: string, userRole: UserRole) {
    if (authorId === userId) return;
    if (ROLE_LEVEL[userRole] >= ROLE_LEVEL.OPERATOR) return;
    throw new ForbiddenException('본인 글만 수정/삭제할 수 있습니다.');
  }
}
