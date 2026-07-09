import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TRAINING_PERMISSION_KEY } from '../decorators/require-training-permission.decorator';

// 교육 운영 기능 접근 가드. 글로벌 JwtAuthGuard 가 request.user 를 채운 뒤 실행된다.
// OPERATOR 이상은 그랜트 없이 통과하고, 그 외에는 TrainingPermission 행 존재 여부를
// 매 요청 DB 에서 확인한다(회수 즉시 반영 — 토큰 재발급 불필요).
@Injectable()
export class TrainingPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      TRAINING_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('권한이 없습니다.');

    if (user.role === UserRole.OPERATOR || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const grant = await this.prisma.trainingPermission.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!grant) throw new ForbiddenException('교육 운영 권한이 없습니다.');
    return true;
  }
}
