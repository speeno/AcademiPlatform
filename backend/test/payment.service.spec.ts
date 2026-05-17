import { PaymentService } from '../src/payment/payment.service';

describe('PaymentService verifyWithPortOne', () => {
  const createService = (env: Record<string, string | undefined>) => {
    const config = {
      get: (key: string, fallback = '') => env[key] ?? fallback,
    };
    return new PaymentService({} as any, config as any, {} as any);
  };

  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.PAYMENT_DEV_BYPASS;
  });

  it('프로덕션에서 포트원 키가 없으면 검증이 실패해야 한다', async () => {
    process.env.NODE_ENV = 'production';
    const service = createService({
      PORTONE_API_KEY: '',
      PORTONE_API_SECRET: '',
    });

    const result = await (service as any).verifyWithPortOne('imp_test', 10000, 'AQ-1');
    expect(result).toBe(false);
  });

  it('개발 환경에서 PAYMENT_DEV_BYPASS=true 일 때만 우회해야 한다', async () => {
    process.env.NODE_ENV = 'development';
    const service = createService({
      PORTONE_API_KEY: '',
      PORTONE_API_SECRET: '',
      PAYMENT_DEV_BYPASS: 'true',
    });

    const result = await (service as any).verifyWithPortOne('imp_test', 10000, 'AQ-1');
    expect(result).toBe(true);
  });

  it('개발 환경에서 bypass 없으면 키 누락 시 실패해야 한다', async () => {
    process.env.NODE_ENV = 'development';
    const service = createService({
      PORTONE_API_KEY: '',
      PORTONE_API_SECRET: '',
    });

    const result = await (service as any).verifyWithPortOne('imp_test', 10000, 'AQ-1');
    expect(result).toBe(false);
  });
});
