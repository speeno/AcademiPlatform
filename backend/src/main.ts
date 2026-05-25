import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { validateRequiredEnv } from './config/validate-env';

async function bootstrap() {
  validateRequiredEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'static', 'covers'), {
    prefix: '/covers/',
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ??
    process.env.FRONTEND_URL ??
    'http://localhost:3300'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = Number(process.env.PORT ?? 4400);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`🚀 AcademiQ API 서버 실행 중: http://${host}:${port}/api`);
}

bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error('❌ AcademiQ API bootstrap failed:', message);
  process.exit(1);
});
