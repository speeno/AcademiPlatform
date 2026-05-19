import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaMock: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prismaMock = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: prismaMock },
      ],
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
        expect.objectContaining({ status: 'ok', db: 'ok' }),
      );
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('returns degraded when DB ping fails', async () => {
      prismaMock.$queryRaw.mockRejectedValueOnce(new Error('boom'));
      const result = await appController.health();
      expect(result).toEqual(
        expect.objectContaining({ status: 'degraded', db: 'down' }),
      );
    });
  });
});
