import { UnauthorizedException } from '@nestjs/common';
import { PortoneWebhookGuard } from '../src/payment/guards/portone-webhook.guard';

describe('PortoneWebhookGuard', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  const mockContext = (headers: Record<string, string | undefined>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as any;

  it('시크릿이 일치하면 통과해야 한다', () => {
    process.env.NODE_ENV = 'production';
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
    const guard = new PortoneWebhookGuard({
      get: () => 'test-secret',
    } as any);

    expect(() =>
      guard.canActivate(mockContext({ 'x-portone-webhook-secret': 'wrong' })),
    ).toThrow(UnauthorizedException);
  });

  it('프로덕션에서 시크릿 미설정이면 401이어야 한다', () => {
    process.env.NODE_ENV = 'production';
    const guard = new PortoneWebhookGuard({
      get: () => '',
    } as any);

    expect(() => guard.canActivate(mockContext({}))).toThrow(UnauthorizedException);
  });
});
