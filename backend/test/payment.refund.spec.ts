import { BadRequestException } from '@nestjs/common';
import { PaymentStatus, PaymentTarget } from '@prisma/client';
import { PaymentService } from '../src/payment/payment.service';

/**
 * P0 회귀 방지: 환불 원자성.
 * - PG 취소 정보 부재 시(키/impUid 없음) DB 상태는 PAID 그대로 유지되어야 한다.
 * - PG 취소 성공 후 DB 업데이트와 rollbackPostPayment 가 단일 $transaction 안에서 수행되어야 한다.
 */
describe('PaymentService.requestRefund atomicity (P0)', () => {
  const buildPrisma = (initial: any) => {
    const payment = { ...initial };
    const txCalls: string[] = [];
    return {
      _payment: payment,
      _txCalls: txCalls,
      payment: {
        findUnique: jest.fn(async () => payment),
        update: jest.fn(async ({ data }: any) => {
          Object.assign(payment, data);
          return { ...payment };
        }),
      },
      enrollment: {
        findFirst: jest.fn(async () => null),
        update: jest.fn(),
      },
      examApplication: { updateMany: jest.fn(async () => ({ count: 0 })) },
      textbookAccess: { updateMany: jest.fn(async () => ({ count: 0 })) },
      $transaction: jest.fn(async (cb: any) => {
        const tx = {
          payment: {
            findUnique: jest.fn(async () => payment),
            update: jest.fn(async ({ data }: any) => {
              txCalls.push('payment.update');
              Object.assign(payment, data);
              return { ...payment };
            }),
          },
          enrollment: {
            findFirst: jest.fn(async () => null),
            update: jest.fn(),
          },
          examApplication: {
            updateMany: jest.fn(async () => {
              txCalls.push('exam.updateMany');
              return { count: 1 };
            }),
          },
          textbookAccess: {
            updateMany: jest.fn(async () => ({ count: 0 })),
          },
        };
        return cb(tx);
      }),
    } as any;
  };

  const buildService = (prisma: any, env: Record<string, string> = {}) => {
    const config = {
      get: (key: string, fallback = '') => env[key] ?? fallback,
    };
    return new PaymentService(prisma, config as any, {} as any);
  };

  const baseEnrollmentPayment = {
    id: 'pay-1',
    userId: 'user-1',
    targetType: PaymentTarget.EXAM_APPLICATION,
    targetId: 'exam-app-1',
    paymentStatus: PaymentStatus.PAID,
    pgTxId: 'imp_123',
    finalAmount: 30000,
    amount: 30000,
  };

  it('PG 취소 키/impUid 부재(프로덕션) 시 DB 상태는 PAID 유지', async () => {
    const prisma = buildPrisma({ ...baseEnrollmentPayment, pgTxId: null });
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const service = buildService(prisma, {
        PORTONE_API_KEY: '',
        PORTONE_API_SECRET: '',
      });
      await expect(
        service.requestRefund('pay-1', 'user-1', 'test'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma._payment.paymentStatus).toBe(PaymentStatus.PAID);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('PAYMENT_DEV_BYPASS=true(개발) 시 PG 호출 건너뛰고 $transaction 단일 원자 업데이트', async () => {
    const prisma = buildPrisma({ ...baseEnrollmentPayment });
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const service = buildService(prisma, {
        PORTONE_API_KEY: '',
        PORTONE_API_SECRET: '',
        PAYMENT_DEV_BYPASS: 'true',
      });
      const refunded = await service.requestRefund('pay-1', 'user-1', 'test');
      expect(refunded.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      // 트랜잭션 내부에서 payment.update + 후처리 rollback 이 함께 수행되었는지 확인.
      expect(prisma._txCalls).toEqual(
        expect.arrayContaining(['payment.update', 'exam.updateMany']),
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
      delete process.env.PAYMENT_DEV_BYPASS;
    }
  });

  it('이미 REFUNDED 상태면 PG 취소 단계에서 거부 (멱등 보호)', async () => {
    const prisma = buildPrisma({
      ...baseEnrollmentPayment,
      paymentStatus: PaymentStatus.REFUNDED,
    });
    const service = buildService(prisma);
    await expect(
      service.requestRefund('pay-1', 'user-1', 'test'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
