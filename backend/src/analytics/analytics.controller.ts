import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Public()
  @Post('analytics/pageview')
  recordPageView(
    @Body()
    body: {
      path: string;
      sessionId: string;
      userId?: string;
      userAgent?: string;
      browser?: string;
      deviceType?: string;
      referrer?: string;
    },
  ) {
    if (!body.path || !body.sessionId) return { ok: false };
    return this.analyticsService.recordPageView(body);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/analytics/summary')
  getSummary(@Query('period') period?: string) {
    const p = (['today', 'week', 'month'] as const).includes(period as any)
      ? (period as 'today' | 'week' | 'month')
      : 'today';
    return this.analyticsService.getSummary(p);
  }
}
