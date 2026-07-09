import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TrainingPermissionService {
  constructor(private prisma: PrismaService) {}

  async hasPermission(user: { id: string; role: UserRole | string }) {
    if (user.role === UserRole.OPERATOR || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }
    const grant = await this.prisma.trainingPermission.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    return !!grant;
  }

  async listGrants() {
    const grants = await this.prisma.trainingPermission.findMany({
      orderBy: { grantedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        grantedBy: { select: { id: true, name: true } },
      },
    });
    return { grants };
  }

  async grant(userId: string, grantedById: string, note?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    return this.prisma.trainingPermission.upsert({
      where: { userId },
      create: { userId, grantedById, note: note ?? null },
      update: { grantedById, note: note ?? null, grantedAt: new Date() },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async revoke(userId: string) {
    const grant = await this.prisma.trainingPermission.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!grant) throw new NotFoundException('부여된 권한이 없습니다.');
    await this.prisma.trainingPermission.delete({ where: { userId } });
    return { success: true };
  }
}
