import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaMock: { pingDb: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      pingDb: jest.fn().mockResolvedValue({ ok: true, latencyMs: 5 }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('returns ok when DB ping succeeds', async () => {
      const result = await appController.health();
      expect(result).toEqual(
        expect.objectContaining({
          status: 'ok',
          db: 'ok',
          dbLatencyMs: 5,
        }),
      );
      expect(prismaMock.pingDb).toHaveBeenCalledTimes(1);
    });

    it('returns degraded when DB ping fails', async () => {
      prismaMock.pingDb.mockResolvedValueOnce({ ok: false, latencyMs: -1 });
      const result = await appController.health();
      expect(result).toEqual(
        expect.objectContaining({
          status: 'degraded',
          db: 'down',
          dbLatencyMs: -1,
        }),
      );
    });
  });
});
