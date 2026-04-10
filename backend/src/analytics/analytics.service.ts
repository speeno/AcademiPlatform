import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async recordPageView(data: {
    path: string;
    sessionId: string;
    userId?: string | null;
    userAgent?: string | null;
    browser?: string | null;
    deviceType?: string | null;
    referrer?: string | null;
  }) {
    return this.prisma.pageView.create({
      data: {
        path: data.path,
        sessionId: data.sessionId,
        userId: data.userId ?? null,
        userAgent: data.userAgent ?? null,
        browser: data.browser ?? null,
        deviceType: data.deviceType ?? null,
        referrer: data.referrer ?? null,
      },
    });
  }

  async getSummary(period: 'today' | 'week' | 'month') {
    const since = this.getPeriodStart(period);
    const where = { createdAt: { gte: since } };

    const [
      totalPV,
      uniqueSessions,
      topPages,
      deviceStats,
      browserStats,
      loginStats,
      referrerStats,
      hourlyRaw,
    ] = await Promise.all([
      this.prisma.pageView.count({ where }),

      this.prisma.pageView.groupBy({
        by: ['sessionId'],
        where,
        _count: { id: true },
      }).then((rows) => rows.length),

      this.prisma.pageView.groupBy({
        by: ['path'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      this.prisma.pageView.groupBy({
        by: ['deviceType'],
        where,
        _count: { id: true },
      }),

      this.prisma.pageView.groupBy({
        by: ['browser'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      Promise.all([
        this.prisma.pageView.count({ where: { ...where, userId: { not: null } } }),
        this.prisma.pageView.count({ where: { ...where, userId: null } }),
      ]),

      this.prisma.pageView.groupBy({
        by: ['referrer'],
        where: { ...where, referrer: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      this.prisma.pageView.findMany({
        where,
        select: { createdAt: true },
      }),
    ]);

    const topPagesWithUV = await Promise.all(
      topPages.map(async (p) => {
        const uvRows = await this.prisma.pageView.groupBy({
          by: ['sessionId'],
          where: { ...where, path: p.path },
        });
        return { path: p.path, pv: p._count.id, uv: uvRows.length };
      }),
    );

    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const row of hourlyRaw) {
      const h = new Date(row.createdAt).getHours();
      hourly[h].count++;
    }

    const dayCount = this.getDayCount(period);

    return {
      totalPV,
      uniqueVisitors: uniqueSessions,
      loggedInPV: loginStats[0],
      anonymousPV: loginStats[1],
      avgDailyPV: dayCount > 0 ? Math.round(totalPV / dayCount) : totalPV,
      topPages: topPagesWithUV,
      hourly,
      devices: deviceStats.map((d) => ({
        type: d.deviceType ?? 'unknown',
        count: d._count.id,
      })),
      browsers: browserStats.map((b) => ({
        name: b.browser ?? 'unknown',
        count: b._count.id,
      })),
      referrers: referrerStats.map((r) => ({
        domain: r.referrer ?? 'unknown',
        count: r._count.id,
      })),
    };
  }

  private getPeriodStart(period: 'today' | 'week' | 'month'): Date {
    const now = new Date();
    if (period === 'today') {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getDayCount(period: 'today' | 'week' | 'month'): number {
    if (period === 'today') return 1;
    if (period === 'week') return 7;
    return 30;
  }
}
