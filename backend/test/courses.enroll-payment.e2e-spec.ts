import { applyE2eTestEnv } from './helpers/e2e-env';
import { createHttpE2eApp } from './helpers/http-e2e.helper';

applyE2eTestEnv();

import { ExecutionContext, INestApplication, CanActivate } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  DiscountType,
  PaymentStatus,
  PaymentTarget,
} from '@prisma/client';
import { CoursesModule } from '../src/courses/courses.module';
import { PrismaModule } from '../src/common/prisma/prisma.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

/** 인증된 user-1 로 고정 */
class TestUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-1', role: 'USER' };
    return true;
  }
}

/**
 * P3: HTTP 레이어 enroll 결제 검증 (P0 회귀).
 */
describe('Courses enroll payment (HTTP e2e)', () => {
  let app: INestApplication<App>;

  const buildCourse = () => ({
    id: 'course-1',
    price: 0,
    basePrice: 100000,
    salePrice: null,
    discountType: DiscountType.NONE,
    discountValue: 0,
    priceValidFrom: null,
    priceValidUntil: null,
    currency: 'KRW',
    pricePolicyVersion: 1,
    learningPeriodDays: null,
    instructor: { id: 'inst-1', name: 'tester' },
  });

  const buildPrisma = (payment?: Record<string, unknown> | null) => ({
    course: { findUnique: jest.fn(async () => buildCourse()) },
    enrollment: {
      findUnique: jest.fn(async () => null),
      upsert: jest.fn(async ({ create }: { create: Record<string, unknown> }) => ({
        id: 'enrollment-1',
        ...create,
      })),
    },
    courseTextbook: { findMany: jest.fn(async () => []) },
    bookVoucherCampaign: { findMany: jest.fn(async () => []) },
    payment: {
      findUnique: jest.fn(async () => payment ?? null),
    },
  });

  beforeAll(async () => {
    const prisma = buildPrisma();
    app = await createHttpE2eApp(() =>
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          PrismaModule,
          CoursesModule,
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

  it('유료 강의에 paymentId 없이 enroll 시 400', async () => {
    await request(app.getHttpServer())
      .post('/api/courses/course-1/enroll')
      .send({})
      .expect(400);
  });

  it('위조 paymentId 로 enroll 시 400', async () => {
    await request(app.getHttpServer())
      .post('/api/courses/course-1/enroll')
      .send({ paymentId: 'fake-payment' })
      .expect(400);
  });

  it('PAID·본인·ENROLLMENT·courseId 일치 시 201', async () => {
    const prisma = app.get(PrismaService) as ReturnType<typeof buildPrisma>;
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: 'pay-1',
      userId: 'user-1',
      targetType: PaymentTarget.ENROLLMENT,
      targetId: 'course-1',
      paymentStatus: PaymentStatus.PAID,
      finalAmount: 100000,
      amount: 100000,
    });

    const res = await request(app.getHttpServer())
      .post('/api/courses/course-1/enroll')
      .send({ paymentId: 'pay-1' })
      .expect(201);

    expect(res.body.courseId).toBe('course-1');
    expect(res.body.paymentId).toBe('pay-1');
  });
});
