import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PortoneWebhookGuard } from '../src/payment/guards/portone-webhook.guard';

describe('PortoneWebhookGuard', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalPaymentModule = process.env.PAYMENT_MODULE_ENABLED;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalPaymentModule === undefined) {
      delete process.env.PAYMENT_MODULE_ENABLED;
    } else {
      process.env.PAYMENT_MODULE_ENABLED = originalPaymentModule;
    }
  });

  const mockContext = (headers: Record<string, string | undefined>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as any;

  it('결제 모듈 비활성 시 503이어야 한다', () => {
    process.env.PAYMENT_MODULE_ENABLED = 'false';
    const guard = new PortoneWebhookGuard({ get: () => 'test-secret' } as any);

    expect(() => guard.canActivate(mockContext({}))).toThrow(
      ServiceUnavailableException,
    );
  });

  it('시크릿이 일치하면 통과해야 한다', () => {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_MODULE_ENABLED = 'true';
    const guard = new PortoneWebhookGuard({
      get: () => 'test-secret',
    } as any);

    expect(
      guard.canActivate(
        mockContext({ 'x-portone-webhook-secret': 'test-secret' }),
      ),
    ).toBe(true);
  });

  it('시크릿이 다르면 401이어야 한다', () => {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_MODULE_ENABLED = 'true';
    const guard = new PortoneWebhookGuard({
      get: () => 'test-secret',
    } as any);

    expect(() =>
      guard.canActivate(mockContext({ 'x-portone-webhook-secret': 'wrong' })),
    ).toThrow(UnauthorizedException);
  });

  it('프로덕션에서 시크릿 미설정이면 401이어야 한다', () => {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_MODULE_ENABLED = 'true';
    const guard = new PortoneWebhookGuard({
      get: () => '',
    } as any);

    expect(() => guard.canActivate(mockContext({}))).toThrow(
      UnauthorizedException,
    );
  });
});
