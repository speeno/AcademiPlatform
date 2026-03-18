import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.FRONTEND_URL ?? 'http://localhost:3300')
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

bootstrap();
