import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { TrainingService } from './training.service';

// 게시용 공개 강의 계획 — 인증 불필요(보기 전용).
// 'schedule' 라우트가 ':token' 보다 먼저 선언되어야 한다.
@Controller('training/plans')
export class TrainingPlansPublicController {
  constructor(private trainingService: TrainingService) {}

  /** 메인 페이지 미니 달력용: 공유 활성 프로그램의 회차 일정 */
  @Public()
  @Get('schedule')
  getPublicSchedule(@Query('from') from?: string, @Query('to') to?: string) {
    return this.trainingService.getPublicSchedule(from, to);
  }

  /** 공유 토큰으로 강의 계획 보기 전용 조회 */
  @Public()
  @Get(':token')
  getSharedPlan(@Param('token') token: string) {
    return this.trainingService.getSharedPlan(token);
  }
}
