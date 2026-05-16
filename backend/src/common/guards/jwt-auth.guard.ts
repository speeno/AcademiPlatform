import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      return super.canActivate(context) as boolean | Promise<boolean>;
    }

    // 공개 API라도 Authorization 헤더가 있으면 사용자 정보를 request.user에 연결
    const request = context.switchToHttp().getRequest();
    const hasAuth =
      !!request.headers?.authorization?.startsWith('Bearer ') ||
      !!request.cookies?.accessToken;

    if (!hasAuth) {
      return true;
    }

    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new UnauthorizedException('인증이 필요합니다.');
    return user;
  }
}
