import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      USER: 1,
      INSTRUCTOR: 2,
      OPERATOR: 3,
      SUPER_ADMIN: 4,
    };

    const userLevel = roleHierarchy[user.role as UserRole] ?? 0;
    const minRequired = Math.min(...requiredRoles.map((r) => roleHierarchy[r] ?? 99));

    if (userLevel < minRequired) {
      throw new ForbiddenException('권한이 없습니다.');
    }
    return true;
  }
}
