import { TextbookService } from '../src/textbook/textbook.service';

/**
 * P0 회귀 방지: 뷰어 토큰 시크릿이 'changeme' 등 약한 fallback 으로 떨어지면 안 된다.
 * - VIEWER_TOKEN_SECRET 우선 사용, 없으면 JWT_SECRET 으로 fallback.
 * - 둘 다 없으면 즉시 예외.
 */
describe('TextbookService viewer token secret (P0)', () => {
  const buildService = (env: Record<string, string | undefined>) => {
    const config = {
      get: (key: string, fallback?: string) =>
        env[key] !== undefined ? env[key] : fallback,
    };
    return new TextbookService({} as any, config as any);
  };

  it('VIEWER_TOKEN_SECRET 가 우선 사용된다', () => {
    const service = buildService({
      VIEWER_TOKEN_SECRET: 'viewer-secret',
      JWT_SECRET: 'jwt-secret',
    });
    const secret = (service as any).resolveViewerTokenSecret();
    expect(secret).toBe('viewer-secret');
  });

  it('VIEWER_TOKEN_SECRET 미설정 시 JWT_SECRET 으로 fallback', () => {
    const service = buildService({
      VIEWER_TOKEN_SECRET: '',
      JWT_SECRET: 'jwt-secret',
    });
    const secret = (service as any).resolveViewerTokenSecret();
    expect(secret).toBe('jwt-secret');
  });

  it("둘 다 없으면 예외 발생 ('changeme' fallback 금지)", () => {
    const service = buildService({
      VIEWER_TOKEN_SECRET: '',
      JWT_SECRET: '',
    });
    expect(() => (service as any).resolveViewerTokenSecret()).toThrow(
      /VIEWER_TOKEN_SECRET/,
    );
  });
});
