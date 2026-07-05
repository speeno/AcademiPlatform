import { applyE2eTestEnv } from './helpers/e2e-env';
import { createHttpE2eApp } from './helpers/http-e2e.helper';

applyE2eTestEnv();

import {
  ExecutionContext,
  INestApplication,
  CanActivate,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CourseStatus, EnrollmentStatus } from '@prisma/client';
import { CoursesModule } from '../src/courses/courses.module';
import { PrismaModule } from '../src/common/prisma/prisma.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { APP_GUARD } from '@nestjs/core';

/** 인증된 user-1 로 고정 */
class TestUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-1', role: 'USER' };
    return true;
  }
}

/**
 * 수강신청 HTTP e2e — 무결제 승인제.
 * enroll 은 결제 없이 PENDING 을 만들며, 넘어온 paymentId 는 무시한다.
 */
describe('Courses enrollment (HTTP e2e)', () => {
  let app: INestApplication<App>;

  const buildCourse = () => ({
    id: 'course-1',
    status: CourseStatus.ACTIVE,
    enrollmentStartAt: null,
    enrollmentEndAt: null,
    maxCapacity: null,
    learningPeriodDays: null,
    instructor: { id: 'inst-1', name: 'tester' },
  });

  const buildPrisma = () => ({
    course: { findUnique: jest.fn(async () => buildCourse()) },
    enrollment: {
      findUnique: jest.fn(async () => null),
      upsert: jest.fn(
        async ({ create }: { create: Record<string, unknown> }) => ({
          id: 'enrollment-1',
          ...create,
        }),
      ),
    },
    courseTextbook: { findMany: jest.fn(async () => []) },
    bookVoucherCampaign: { findMany: jest.fn(async () => []) },
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

  it('enroll 은 결제 없이 PENDING 신청을 생성한다', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/courses/course-1/enroll')
      .send({})
      .expect(201);

    expect(res.body.courseId).toBe('course-1');
    expect(res.body.status).toBe(EnrollmentStatus.PENDING);
    expect(res.body.paymentId ?? null).toBeNull();
  });

  it('enroll 은 넘어온 paymentId 를 무시한다(승인제)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/courses/course-1/enroll')
      .send({ paymentId: 'whatever' })
      .expect(201);

    expect(res.body.status).toBe(EnrollmentStatus.PENDING);
    expect(res.body.paymentId ?? null).toBeNull();
  });
});
