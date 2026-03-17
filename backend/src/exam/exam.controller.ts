import {
  Body, Controller, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ExamApplicationStatus, ExamSessionStatus, UserRole } from '@prisma/client';
import { ExamService } from './exam.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exam')
export class ExamController {
  constructor(private examService: ExamService) {}

  /* 공개 API */
  @Public()
  @Get('sessions')
  findSessions(
    @Query('status') status?: ExamSessionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.findSessions({ status, page, limit });
  }

  @Public()
  @Get('sessions/:id')
  findSessionById(@Param('id') id: string) {
    return this.examService.findSessionById(id);
  }

  /* 인증 필요 */
  @Post('sessions/:id/apply')
  createApplication(
    @Param('id') sessionId: string,
    @CurrentUser() user: any,
    @Body() formJson: object,
  ) {
    return this.examService.createApplication(sessionId, user.id, formJson);
  }

  @Get('my/applications')
  getMyApplications(@CurrentUser() user: any) {
    return this.examService.getMyApplications(user.id);
  }

  @Post('my/applications/:id/cancel')
  cancelApplication(@Param('id') id: string, @CurrentUser() user: any) {
    return this.examService.cancelApplication(id, user.id);
  }

  /* 관리자 API */
  @Roles(UserRole.OPERATOR)
  @Post('admin/sessions')
  createSession(@Body() data: any) {
    return this.examService.createSession(data);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/sessions/:id')
  updateSession(@Param('id') id: string, @Body() data: any) {
    return this.examService.updateSession(id, data);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/sessions/:id/applications')
  getApplicationsBySession(
    @Param('id') sessionId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.getApplicationsBySession(sessionId, page, limit);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/applications/:id/status')
  updateApplicationStatus(
    @Param('id') id: string,
    @Body('status') status: ExamApplicationStatus,
  ) {
    return this.examService.updateApplicationStatus(id, status);
  }
}
