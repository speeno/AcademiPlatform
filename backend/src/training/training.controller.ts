import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireTrainingPermission } from './decorators/require-training-permission.decorator';
import { TrainingPermissionGuard } from './guards/training-permission.guard';
import { TrainingService } from './training.service';
import { TrainingCertificateService } from './training-certificate.service';
import {
  CreateTrainingProgramDto,
  TrainingProgramFilterDto,
  UpdateTrainingProgramDto,
} from './dto/training-program.dto';
import {
  BulkCreateTrainingSessionsDto,
  CreateTrainingSessionDto,
  UpdateTrainingSessionDto,
} from './dto/training-session.dto';
import {
  AddTrainingParticipantDto,
  UpdateTrainingParticipantDto,
} from './dto/training-participant.dto';
import { BulkUpsertAttendanceDto } from './dto/training-attendance.dto';
import {
  IssueTrainingCertificatesDto,
  RevokeTrainingCertificateDto,
} from './dto/training-certificate.dto';

@UseGuards(TrainingPermissionGuard)
@RequireTrainingPermission()
@Controller('training')
export class TrainingController {
  constructor(
    private trainingService: TrainingService,
    private certificateService: TrainingCertificateService,
  ) {}

  /* ── 프로그램 ── */

  @Get('programs')
  listPrograms(
    @Query() filter: TrainingProgramFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.listPrograms(user, filter);
  }

  @Post('programs')
  createProgram(
    @Body() dto: CreateTrainingProgramDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.createProgram(user, dto);
  }

  @Get('programs/:id')
  getProgram(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.getProgram(user, id);
  }

  @Patch('programs/:id')
  updateProgram(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingProgramDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.updateProgram(user, id, dto);
  }

  @Delete('programs/:id')
  deleteProgram(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.deleteProgram(user, id);
  }

  /* ── 게시용 공유 링크 ── */

  @Post('programs/:id/share')
  enableShareLink(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.enableShareLink(user, id);
  }

  @Delete('programs/:id/share')
  disableShareLink(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.disableShareLink(user, id);
  }

  /* ── 캘린더 피드 / 검색 ── */

  @Get('calendar')
  getCalendar(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.getCalendar(user, from, to);
  }

  @Get('courses')
  searchCourses(@Query('search') search?: string) {
    return this.trainingService.searchCourses(search);
  }

  @Get('users/search')
  searchUsers(@Query('q') q?: string) {
    return this.trainingService.searchUsers(q);
  }

  /* ── 회차 ── */

  @Post('programs/:id/sessions')
  addSession(
    @Param('id') programId: string,
    @Body() dto: CreateTrainingSessionDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.addSession(user, programId, dto);
  }

  @Post('programs/:id/sessions/bulk')
  addSessionsBulk(
    @Param('id') programId: string,
    @Body() dto: BulkCreateTrainingSessionsDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.addSessionsBulk(user, programId, dto);
  }

  @Patch('sessions/:sessionId')
  updateSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateTrainingSessionDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.updateSession(user, sessionId, dto);
  }

  @Delete('sessions/:sessionId')
  deleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.deleteSession(user, sessionId);
  }

  /* ── 참가자 ── */

  @Get('programs/:id/participants')
  listParticipants(@Param('id') programId: string, @CurrentUser() user: any) {
    return this.trainingService.listParticipants(user, programId);
  }

  @Post('programs/:id/participants')
  addParticipant(
    @Param('id') programId: string,
    @Body() dto: AddTrainingParticipantDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.addParticipant(user, programId, dto);
  }

  @Patch('participants/:participantId')
  updateParticipant(
    @Param('participantId') participantId: string,
    @Body() dto: UpdateTrainingParticipantDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.updateParticipant(user, participantId, dto);
  }

  @Delete('participants/:participantId')
  removeParticipant(
    @Param('participantId') participantId: string,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.removeParticipant(user, participantId);
  }

  /* ── 출석 ── */

  @Get('sessions/:sessionId/attendance')
  getSessionAttendance(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.getSessionAttendance(user, sessionId);
  }

  @Put('sessions/:sessionId/attendance')
  bulkUpsertAttendance(
    @Param('sessionId') sessionId: string,
    @Body() dto: BulkUpsertAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.bulkUpsertAttendance(user, sessionId, dto);
  }

  @Get('programs/:id/attendance-summary')
  getAttendanceSummary(
    @Param('id') programId: string,
    @CurrentUser() user: any,
  ) {
    return this.trainingService.getAttendanceSummary(user, programId);
  }

  /* ── 수료증 ── */

  @Get('programs/:id/certificates')
  listCertificates(@Param('id') programId: string, @CurrentUser() user: any) {
    return this.certificateService.listCertificates(user, programId);
  }

  @Post('programs/:id/certificates')
  issueCertificates(
    @Param('id') programId: string,
    @Body() dto: IssueTrainingCertificatesDto,
    @CurrentUser() user: any,
  ) {
    return this.certificateService.issueCertificates(
      user,
      programId,
      dto.participantIds,
    );
  }

  @Post('certificates/:certId/revoke')
  revokeCertificate(
    @Param('certId') certId: string,
    @Body() dto: RevokeTrainingCertificateDto,
    @CurrentUser() user: any,
  ) {
    return this.certificateService.revoke(user, certId, dto.reason);
  }

  @Post('certificates/:certId/reissue')
  reissueCertificate(@Param('certId') certId: string, @CurrentUser() user: any) {
    return this.certificateService.reissue(user, certId);
  }

  @Get('certificates/:certId/pdf')
  async getCertificatePdf(
    @Param('certId') certId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.certificateService.getCertificatePdf(
      user,
      certId,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    });
    res.send(buffer);
  }
}
