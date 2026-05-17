import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { isPaymentModuleEnabled } from '../../config/payment-env';

@Injectable()
export class PortoneWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (!isPaymentModuleEnabled()) {
      throw new ServiceUnavailableException(
        '결제 기능이 아직 활성화되지 않았습니다.',
      );
    }

    const secret = this.config.get<string>('PORTONE_WEBHOOK_SECRET', '')?.trim();
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('웹훅 시크릿이 설정되지 않았습니다.');
      }
      return true;
    }

    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const provided =
      req.headers['x-portone-webhook-secret'] ??
      req.headers['x-webhook-secret'] ??
      req.headers['authorization']?.replace(/^Bearer\s+/i, '');

    if (!provided || !this.safeEqual(provided, secret)) {
      throw new UnauthorizedException('웹훅 서명이 올바르지 않습니다.');
    }
    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
