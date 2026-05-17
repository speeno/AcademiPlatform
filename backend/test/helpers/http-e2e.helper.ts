import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModuleBuilder } from '@nestjs/testing';

/** Nest 11: imports 는 createTestingModule({ imports }) 에 전달 */
export async function createHttpE2eApp(
  configure: () => TestingModuleBuilder,
): Promise<INestApplication> {
  const moduleRef = await configure().compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return app;
}
