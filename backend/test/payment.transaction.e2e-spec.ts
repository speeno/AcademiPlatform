import { applyE2eTestEnv } from './helpers/e2e-env';

applyE2eTestEnv();

import { PaymentStatus, PaymentTarget } from '@prisma/client';
import { PaymentService } from '../src/payment/payment.service';

/**
 * P3: verifyAndComplete 후처리 트랜잭션 롤백 — PAID 미커밋.
 */
describe('Payment verify transaction rollback (e2e)', () => {
  const basePayment = {
    id: 'pay-1',
    orderNo: 'AQ-order-1',
    userId: 'user-1',
    targetType: PaymentTarget.ENROLLMENT,
    targetId: 'course-1',
    paymentStatus: PaymentStatus.PENDING,
    finalAmount: 50000,
    amount: 50000,
    pgTxId: null,
  };

  it('후처리(applyInTx) 실패 시 결제 상태는 PENDING 유지', async () => {
    const payment = { ...basePayment };
    const postProcessor = {
      applyInTx: jest.fn(async () => {
        throw new Error('post-process failed');
      }),
      rollbackInTx: jest.fn(),
    };

    const prisma = {
      payment: {
        findUnique: jest.fn(async () => ({ ...payment })),
        update: jest.fn(async ({ data }: { data: Partial<typeof payment> }) => {
          Object.assign(payment, data);
          return { ...payment };
        }),
      },
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        const snapshot = { ...payment };
        const tx = {
          payment: {
            findUnique: jest.fn(async () => ({ ...payment })),
            update: jest.fn(async ({ data }: { data: Partial<typeof payment> }) => {
              Object.assign(payment, data);
              return { ...payment };
            }),
          },
        };
        try {
          return await cb(tx);
        } catch (err) {
          Object.assign(payment, snapshot);
          throw err;
        }
      }),
    };

    const config = {
      get: (key: string, fallback = '') => {
        const env: Record<string, string> = {
          PAYMENT_DEV_BYPASS: 'true',
          PORTONE_API_KEY: '',
          PORTONE_API_SECRET: '',
        };
        return env[key] ?? fallback;
      },
    };

    const service = new PaymentService(
      prisma as never,
      config as never,
      {} as never,
      undefined,
      undefined,
      postProcessor as never,
    );

    jest.spyOn(service as never, 'verifyWithPortOne').mockResolvedValue(true);

    await expect(
      service.verifyAndComplete('user-1', 'imp_test', 'AQ-order-1'),
    ).rejects.toThrow();

    expect(payment.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(postProcessor.applyInTx).toHaveBeenCalled();
  });

  it('이미 PAID 멱등 호출은 추가 트랜잭션 없이 반환', async () => {
    const payment = {
      ...basePayment,
      paymentStatus: PaymentStatus.PAID,
      pgTxId: 'imp_done',
    };
    const prisma = {
      payment: { findUnique: jest.fn(async () => ({ ...payment })) },
      $transaction: jest.fn(),
    };
    const config = { get: () => '' };
    const service = new PaymentService(
      prisma as never,
      config as never,
      {} as never,
    );

    const result = await service.verifyAndComplete(
      'user-1',
      'imp_done',
      'AQ-order-1',
    );
    expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
