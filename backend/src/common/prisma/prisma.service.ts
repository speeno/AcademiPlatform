import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export type DbPingResult = {
  ok: boolean;
  latencyMs: number;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 300_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
    });
    // @prisma/adapter-pg bundles its own @types/pg — root pg Pool needs cast
    const adapter = new PrismaPg(
      pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
    );
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }

  /** 경량 DB ping — 실패 시 disconnect/connect 후 1회 재시도 */
  async pingDb(): Promise<DbPingResult> {
    const measure = async (): Promise<number> => {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      return Date.now() - start;
    };

    try {
      const latencyMs = await measure();
      return { ok: true, latencyMs };
    } catch {
      try {
        await this.$disconnect();
        await this.$connect();
        const latencyMs = await measure();
        return { ok: true, latencyMs };
      } catch {
        return { ok: false, latencyMs: -1 };
      }
    }
  }
}
