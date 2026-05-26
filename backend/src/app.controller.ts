import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './common/prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get('health')
  async health(): Promise<{
    status: string;
    db: 'ok' | 'down';
    dbLatencyMs: number;
    timestamp: string;
  }> {
    const ping = await this.prisma.pingDb();
    const db = ping.ok ? 'ok' : 'down';
    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      dbLatencyMs: ping.latencyMs,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
