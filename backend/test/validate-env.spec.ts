import { validateRequiredEnv } from '../src/config/validate-env';

/**
 * P0 회귀 방지: 프로덕션 부팅 시 결제·DB·웹훅 시크릿 누락은 fail-fast.
 */
describe('validateRequiredEnv (P0)', () => {
  const ORIGINAL_ENV = { ...process.env };
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: number | string | null | undefined) => {
        throw new Error(`__exit_${code}`);
      });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    exitSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('JWT_SECRET / JWT_REFRESH_SECRET 누락 시 종료', () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateRequiredEnv()).toThrow('__exit_1');
  });

  it('프로덕션에서 PORTONE_WEBHOOK_SECRET 누락 시 종료', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-secret';
    process.env.JWT_REFRESH_SECRET = 'b-secret';
    process.env.DATABASE_URL = 'postgres://x';
    process.env.PORTONE_API_KEY = 'k';
    process.env.PORTONE_API_SECRET = 's';
    delete process.env.PORTONE_WEBHOOK_SECRET;
    expect(() => validateRequiredEnv()).toThrow('__exit_1');
  });

  it('프로덕션에서 PORTONE_API_KEY 누락 시 종료', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-secret';
    process.env.JWT_REFRESH_SECRET = 'b-secret';
    process.env.DATABASE_URL = 'postgres://x';
    delete process.env.PORTONE_API_KEY;
    process.env.PORTONE_API_SECRET = 's';
    process.env.PORTONE_WEBHOOK_SECRET = 'w';
    expect(() => validateRequiredEnv()).toThrow('__exit_1');
  });

  it('프로덕션에서 DATABASE_URL 누락 시 종료', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-secret';
    process.env.JWT_REFRESH_SECRET = 'b-secret';
    delete process.env.DATABASE_URL;
    process.env.PORTONE_API_KEY = 'k';
    process.env.PORTONE_API_SECRET = 's';
    process.env.PORTONE_WEBHOOK_SECRET = 'w';
    expect(() => validateRequiredEnv()).toThrow('__exit_1');
  });

  it('프로덕션에서 PAYMENT_DEV_BYPASS=true 면 종료', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-secret';
    process.env.JWT_REFRESH_SECRET = 'b-secret';
    process.env.DATABASE_URL = 'postgres://x';
    process.env.PORTONE_API_KEY = 'k';
    process.env.PORTONE_API_SECRET = 's';
    process.env.PORTONE_WEBHOOK_SECRET = 'w';
    process.env.PAYMENT_DEV_BYPASS = 'true';
    expect(() => validateRequiredEnv()).toThrow('__exit_1');
  });

  it('프로덕션 필수 변수 모두 갖춰진 경우 정상 통과', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-secret';
    process.env.JWT_REFRESH_SECRET = 'b-secret';
    process.env.DATABASE_URL = 'postgres://x';
    process.env.PORTONE_API_KEY = 'k';
    process.env.PORTONE_API_SECRET = 's';
    process.env.PORTONE_WEBHOOK_SECRET = 'w';
    process.env.PAYMENT_DEV_BYPASS = 'false';
    process.env.VIEWER_TOKEN_SECRET = 'v';
    expect(() => validateRequiredEnv()).not.toThrow();
  });

  it('비프로덕션은 결제 키 누락이어도 통과(경고만)', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'a';
    process.env.JWT_REFRESH_SECRET = 'b';
    delete process.env.PORTONE_API_KEY;
    delete process.env.PORTONE_API_SECRET;
    expect(() => validateRequiredEnv()).not.toThrow();
  });
});
