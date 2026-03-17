import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma/prisma.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { LmsModule } from './lms/lms.module';
import { MediaModule } from './media/media.module';
import { TextbookModule } from './textbook/textbook.module';
import { ExamModule } from './exam/exam.module';
import { PaymentModule } from './payment/payment.module';
import { IntroModule } from './intro/intro.module';
import { NotifyModule } from './notify/notify.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    CoursesModule,
    LmsModule,
    MediaModule,
    TextbookModule,
    ExamModule,
    PaymentModule,
    IntroModule,
    NotifyModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
