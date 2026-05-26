import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

const DEFAULT_INTERVAL_MS = 240_000;
const SLOW_PING_MS = 3_000;

function isKeepaliveEnabled(): boolean {
  if (process.env.DB_KEEPALIVE_ENABLED === 'true') return true;
  if (process.env.DB_KEEPALIVE_ENABLED === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

@Injectable()
export class DbKeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DbKeepAliveService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (!isKeepaliveEnabled()) {
      this.logger.log('DB keepalive disabled');
      return;
    }

    const raw = Number(process.env.DB_KEEPALIVE_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
    const intervalMs =
      Number.isFinite(raw) && raw >= 60_000 ? raw : DEFAULT_INTERVAL_MS;

    this.logger.log(`DB keepalive every ${intervalMs}ms`);
    void this.ping();
    this.timer = setInterval(() => void this.ping(), intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async ping() {
    const result = await this.prisma.pingDb();
    if (!result.ok) {
      this.logger.warn('DB ping failed after reconnect attempt');
      return;
    }
    if (result.latencyMs > SLOW_PING_MS) {
      this.logger.warn(`DB ping slow: latencyMs=${result.latencyMs}`);
    }
  }
}
