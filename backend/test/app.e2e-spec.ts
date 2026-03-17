import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App bootstrap (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('응답 가능한 서버로 기동되어야 한다', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect((res) => {
        expect([200, 401, 403, 404]).toContain(res.status);
      });
  });
});
