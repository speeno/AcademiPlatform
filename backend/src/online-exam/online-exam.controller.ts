import { Body, Controller, Get, MessageEvent, Param, Patch, Post, Query, Sse } from '@nestjs/common';
import { ExamEligibilityStatus, UserRole } from '@prisma/client';
import { from, interval, map, startWith, switchMap } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { OnlineExamService } from './online-exam.service';

@Controller('online-exam')
export class OnlineExamController {
  constructor(private readonly service: OnlineExamService) {}

  /* ── Admin: 문제은행 ─────────────────────────────────────── */

  @Roles(UserRole.OPERATOR)
  @Get('admin/question-banks')
  listQuestionBanks() {
    return this.service.listQuestionBanks();
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/question-banks')
  createQuestionBank(@Body() body: any) {
    return this.service.createQuestionBank(body);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/questions')
  listQuestions(@Query('bankId') bankId?: string) {
    return this.service.listQuestions(bankId);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/questions')
  createQuestion(@Body() body: any) {
    return this.service.createQuestion(body);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/questions/:id')
  updateQuestion(@Param('id') id: string, @Body() body: any) {
    return this.service.updateQuestion(id, body);
  }

  /* ── Admin: 시험지·승인·설정 ─────────────────────────────── */

  @Roles(UserRole.OPERATOR)
  @Get('admin/sessions/:sessionId/paper')
  getPaper(@Param('sessionId') sessionId: string) {
    return this.service.getPaper(sessionId);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/sessions/:sessionId/paper')
  upsertPaper(@Param('sessionId') sessionId: string, @Body() body: any) {
    return this.service.upsertPaper(sessionId, body);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/sessions/:sessionId/paper/publish')
  publishPaper(@Param('sessionId') sessionId: string) {
    return this.service.publishPaper(sessionId);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/sessions/:sessionId/online-settings')
  updateSessionOnlineSettings(
    @Param('sessionId') sessionId: string,
    @Body() body: any,
  ) {
    return this.service.updateSessionOnlineSettings(sessionId, body);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/applications/:id/eligibility')
  updateApplicationEligibility(
    @Param('id') id: string,
    @Body('eligibility') eligibility: ExamEligibilityStatus,
    @CurrentUser() actor: { id: string; role: UserRole },
  ) {
    return this.service.updateApplicationEligibility(id, eligibility, actor);
  }

  /* ── Admin: 채점·감독 ───────────────────────────────────── */

  @Roles(UserRole.OPERATOR)
  @Get('admin/sessions/:sessionId/grading')
  listGradingQueue(@Param('sessionId') sessionId: string) {
    return this.service.listGradingQueue(sessionId);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/answers/:answerId/grade')
  gradeAnswer(
    @Param('answerId') answerId: string,
    @Body() body: any,
    @CurrentUser() actor: { id: string; role: UserRole },
  ) {
    return this.service.gradeAnswer(answerId, body, actor);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/attempts/:attemptId/finalize')
  finalizeAttempt(@Param('attemptId') attemptId: string) {
    return this.service.finalizeAttempt(attemptId);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/attempts/:attemptId/publish-result')
  publishResult(
    @Param('attemptId') attemptId: string,
    @CurrentUser() actor: { id: string; role: UserRole },
  ) {
    return this.service.publishResult(attemptId, actor);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/sessions/:sessionId/proctor')
  listProctorSession(@Param('sessionId') sessionId: string) {
    return this.service.listProctorSession(sessionId);
  }

  @Roles(UserRole.OPERATOR)
  @Sse('admin/sessions/:sessionId/proctor/stream')
  streamProctorSession(@Param('sessionId') sessionId: string) {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() => from(this.service.listProctorSession(sessionId))),
      map((data): MessageEvent => ({ type: 'proctor', data })),
    );
  }

  /* ── Candidate: 응시 ────────────────────────────────────── */

  @Get('sessions/:sessionId/lobby')
  getLobby(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.getLobby(sessionId, user.id);
  }

  @Post('sessions/:sessionId/attempts/start')
  startAttempt(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.startAttempt(sessionId, user.id);
  }

  @Get('attempts/:attemptId')
  getAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.getAttempt(attemptId, user.id);
  }

  @Patch('attempts/:attemptId/answers')
  saveAnswer(
    @Param('attemptId') attemptId: string,
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.saveAnswer(attemptId, user.id, body);
  }

  @Post('attempts/:attemptId/submit')
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.submitAttempt(attemptId, user.id);
  }

  @Post('attempts/:attemptId/proctor-events')
  recordProctorEvent(
    @Param('attemptId') attemptId: string,
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.recordProctorEvent(attemptId, user.id, body);
  }

  @Post('attempts/:attemptId/snapshots')
  recordSnapshot(
    @Param('attemptId') attemptId: string,
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.recordSnapshot(attemptId, user.id, body);
  }

  @Get('my/results/:attemptId')
  getMyResult(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.getMyResult(attemptId, user.id);
  }
}
