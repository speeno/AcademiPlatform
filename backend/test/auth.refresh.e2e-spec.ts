import { applyE2eTestEnv } from './helpers/e2e-env';
import { createHttpE2eApp } from './helpers/http-e2e.helper';

applyE2eTestEnv();

import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PrismaModule } from '../src/common/prisma/prisma.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

/**
 * P3: 만료된 access + 유효한 refresh 로 세션 복구.
 * - GET /auth/me 는 access 만료 시 401
 * - POST /auth/refresh 는 refresh body 로 새 토큰 발급
 */
describe('Auth refresh (HTTP e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  const activeUser = {
    id: 'user-1',
    email: 'refresh-e2e@test.com',
    name: 'Refresh E2E',
    role: 'USER',
    status: 'ACTIVE',
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id?: string } }) =>
        where.id === activeUser.id ? activeUser : null,
      ),
    },
  };

  beforeAll(async () => {
    app = await createHttpE2eApp(() =>
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          PrismaModule,
          AuthModule,
        ],
        providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrisma),
    );
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('만료된 access 토큰으로 /auth/me 호출 시 401', async () => {
    const expiredAccess = jwt.sign(
      { sub: activeUser.id, email: activeUser.email, role: activeUser.role },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '-1s',
      },
    );

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredAccess}`)
      .expect(401);
  });

  it('유효한 refresh 토큰으로 새 access/refresh 발급', async () => {
    const refreshToken = jwt.sign(
      { sub: activeUser.id, email: activeUser.email, role: activeUser.role },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      },
    );

    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    const payload = jwt.verify(res.body.accessToken, {
      secret: process.env.JWT_SECRET,
    }) as { sub: string };
    expect(payload.sub).toBe(activeUser.id);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200)
      .expect((r) => {
        expect(r.body.id).toBe(activeUser.id);
      });
  });

  it('잘못된 refresh 토큰은 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: 'not-a-jwt' })
      .expect(401);
  });
});
