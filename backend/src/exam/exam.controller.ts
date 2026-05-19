import {
  Body, Controller, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExamApplicationStatus, ExamSessionStatus, UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
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
    @CurrentUser() user?: { id: string },
  ) {
    return this.examService.findSessions({ status, page, limit }, user?.id);
  }

  @Public()
  @Get('sessions/:id')
  findSessionById(@Param('id') id: string, @CurrentUser() user?: { id: string }) {
    return this.examService.findSessionById(id, user?.id);
  }

  @Post('sessions/:id/apply')
  @UseInterceptors(FileInterceptor('idPhoto', { limits: { fileSize: 10 * 1024 * 1024 } }))
  createApplication(
    @Param('id') sessionId: string,
    @CurrentUser() user: { id?: string } | undefined,
    @Body() body: Record<string, unknown>,
    @Body('formJson') formJsonRaw: string | undefined,
    @UploadedFile()
    file:
      | { originalname?: string; mimetype?: string; buffer?: Buffer; size?: number }
      | undefined,
  ) {
    const payload = formJsonRaw ?? body;
    return this.examService.createApplication(sessionId, user?.id ?? null, payload, file);
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
  @Get('admin/sessions')
  listAllSessions(
    @Query('status') status?: ExamSessionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examService.findAllSessions({ status, page, limit });
  }

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

  @Roles(UserRole.OPERATOR)
  @Get('admin/applications/:id/id-photo')
  async downloadApplicationIdPhoto(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.examService.getApplicationIdPhoto(id);
    const encodedFileName = encodeURIComponent(file.fileName);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
      'Content-Length': file.size,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(file.buffer);
  }
}
