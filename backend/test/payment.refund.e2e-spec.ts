import { applyE2eTestEnv } from './helpers/e2e-env';
import { createHttpE2eApp } from './helpers/http-e2e.helper';

applyE2eTestEnv();

import { ExecutionContext, INestApplication, CanActivate } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PaymentStatus, PaymentTarget } from '@prisma/client';
import { PaymentModule } from '../src/payment/payment.module';
import { PrismaModule } from '../src/common/prisma/prisma.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { APP_GUARD } from '@nestjs/core';

class TestUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-1', role: 'USER' };
    return true;
  }
}

/**
 * P3: HTTP 환불 — PG 실패 시 PAID 유지, dev bypass 시 REFUNDED.
 */
describe('Payment refund (HTTP e2e)', () => {
  let app: INestApplication<App>;
  let payment: Record<string, unknown>;

  beforeAll(async () => {
    payment = {
      id: 'pay-refund-1',
      userId: 'user-1',
      targetType: PaymentTarget.EXAM_APPLICATION,
      targetId: 'exam-1',
      paymentStatus: PaymentStatus.PAID,
      pgTxId: null,
      finalAmount: 30000,
      amount: 30000,
    };

    const prisma = {
      payment: {
        findUnique: jest.fn(async () => ({ ...payment })),
        update: jest.fn(),
      },
      enrollment: { findFirst: jest.fn(async () => null), update: jest.fn() },
      examApplication: { updateMany: jest.fn(async () => ({ count: 0 })) },
      textbookAccess: { updateMany: jest.fn(async () => ({ count: 0 })) },
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          payment: {
            findUnique: jest.fn(async () => ({ ...payment })),
            update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
              Object.assign(payment, data);
              return { ...payment };
            }),
          },
          enrollment: { findFirst: jest.fn(async () => null), update: jest.fn() },
          examApplication: { updateMany: jest.fn(async () => ({ count: 0 })) },
          textbookAccess: { updateMany: jest.fn(async () => ({ count: 0 })) },
        };
        return cb(tx);
      }),
    };

    app = await createHttpE2eApp(() =>
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                PAYMENT_DEV_BYPASS: 'true',
                PORTONE_API_KEY: '',
                PORTONE_API_SECRET: '',
              }),
            ],
          }),
          PrismaModule,
          PaymentModule,
        ],
        providers: [{ provide: APP_GUARD, useClass: TestUserGuard }],
      })
        .overrideProvider(PrismaService)
        .useValue(prisma),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('dev bypass 환불 성공 시 REFUNDED', async () => {
    payment.paymentStatus = PaymentStatus.PAID;
    const res = await request(app.getHttpServer())
      .post('/api/payments/pay-refund-1/refund')
      .send({ reason: 'e2e test' })
      .expect(201);

    expect(res.body.paymentStatus).toBe(PaymentStatus.REFUNDED);
  });

  it('PG 키 없음(프로덕션) 시 400 및 PAID 유지', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    payment.paymentStatus = PaymentStatus.PAID;
    payment.pgTxId = null;

    try {
      await request(app.getHttpServer())
        .post('/api/payments/pay-refund-1/refund')
        .send({ reason: 'should fail' })
        .expect(400);
      expect(payment.paymentStatus).toBe(PaymentStatus.PAID);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
