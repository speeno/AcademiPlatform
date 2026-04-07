import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CmsCollaboratorRole, CmsReviewStatus, UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CmsService } from './cms.service';
import {
  ReviewDecisionDto,
  SaveLessonContentDto,
  UploadUrlDto,
  UpsertCollaboratorDto,
} from './dto/cms.dto';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Roles(UserRole.USER)
  @Get('courses/my')
  getMyCourses(@CurrentUser() user: any) {
    return this.cmsService.getMyCourses(user.id);
  }

  @Roles(UserRole.USER)
  @Get('courses/:courseId/tree')
  getCourseTree(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.cmsService.getCourseTree(courseId, user.id);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('courses/:courseId/owner')
  setCourseOwner(
    @Param('courseId') courseId: string,
    @Body('ownerUserId') ownerUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.cmsService.setCourseOwner(courseId, ownerUserId, user.id);
  }

  @Roles(UserRole.OPERATOR)
  @Post('courses/:courseId/collaborators')
  addCollaborator(
    @Param('courseId') courseId: string,
    @Body() dto: UpsertCollaboratorDto,
    @CurrentUser() user: any,
  ) {
    return this.cmsService.upsertCollaborator(
      courseId,
      dto.userId,
      dto.role ?? CmsCollaboratorRole.EDITOR,
      user.id,
    );
  }

  @Roles(UserRole.OPERATOR)
  @Delete('courses/:courseId/collaborators/:userId')
  removeCollaborator(
    @Param('courseId') courseId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.cmsService.removeCollaborator(courseId, targetUserId, user.id);
  }

  @Roles(UserRole.USER)
  @Get('lessons/:lessonId/content')
  getLessonContent(@Param('lessonId') lessonId: string, @CurrentUser() user: any) {
    return this.cmsService.getLessonContent(lessonId, user.id);
  }

  @Roles(UserRole.USER)
  @Get('assets/:assetId/file')
  async streamAssetFile(
    @Param('assetId') assetId: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.cmsService.getPublishedAssetFile(assetId, user.id);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return new StreamableFile(file.buffer);
  }

  @Roles(UserRole.USER)
  @Get('lessons/:lessonId/history')
  getLessonHistory(@Param('lessonId') lessonId: string, @CurrentUser() user: any) {
    return this.cmsService.getLessonHistory(lessonId, user.id);
  }

  @Roles(UserRole.USER)
  @Post('lessons/:lessonId/content')
  saveLessonContent(
    @Param('lessonId') lessonId: string,
    @Body() dto: SaveLessonContentDto,
    @CurrentUser() user: any,
  ) {
    return this.cmsService.saveLessonContent(lessonId, user.id, dto);
  }

  @Roles(UserRole.USER)
  @Post('assets/upload-url')
  getUploadUrl(@Body() dto: UploadUrlDto, @CurrentUser() user: any) {
    return this.cmsService.getUploadUrl(user.id, dto);
  }

  @Roles(UserRole.USER)
  @Post('lessons/:lessonId/assets')
  attachAsset(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: any,
    @Body()
    dto: {
      versionNo?: number;
      assetType: string;
      mimeType: string;
      storageKey?: string;
      publicUrl?: string;
      fileName?: string;
      fileSize?: number;
      metaJson?: Record<string, any>;
    },
  ) {
    return this.cmsService.attachAsset(lessonId, user.id, dto);
  }

  @Roles(UserRole.USER)
  @Post('lessons/:lessonId/review-request')
  requestReview(@Param('lessonId') lessonId: string, @CurrentUser() user: any) {
    return this.cmsService.requestReview(lessonId, user.id);
  }

  @Roles(UserRole.OPERATOR)
  @Get('review-queue')
  getReviewQueue(@CurrentUser() user: any) {
    return this.cmsService.getReviewQueue(user.id);
  }

  @Roles(UserRole.OPERATOR)
  @Post('review/:requestId/approve')
  approveReview(@Param('requestId') requestId: string, @CurrentUser() user: any) {
    return this.cmsService.reviewDecision(requestId, user.id, { status: CmsReviewStatus.APPROVED });
  }

  @Roles(UserRole.OPERATOR)
  @Post('review/:requestId/reject')
  rejectReview(
    @Param('requestId') requestId: string,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() user: any,
  ) {
    return this.cmsService.reviewDecision(requestId, user.id, {
      status: CmsReviewStatus.REJECTED,
      rejectReason: dto.rejectReason,
    });
  }

  @Roles(UserRole.OPERATOR)
  @Post('lessons/:lessonId/rollback')
  rollback(
    @Param('lessonId') lessonId: string,
    @Query('versionNo') versionNo: number,
    @CurrentUser() user: any,
  ) {
    return this.cmsService.rollbackLesson(lessonId, Number(versionNo), user.id);
  }

  @Roles(UserRole.USER)
  @Get('package-asset')
  async streamPackageAsset(
    @Query('storageKey') storageKey: string,
    @Query('lessonId') lessonId: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.cmsService.getPackageAssetFile(storageKey, lessonId, user.id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return new StreamableFile(file.buffer);
  }

  @Roles(UserRole.USER)
  @Post('lessons/:lessonId/course-package')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 500 * 1024 * 1024 } }))
  uploadCoursePackage(
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @CurrentUser() user: any,
  ) {
    return this.cmsService.processCoursePackageUpload(lessonId, user.id, file);
  }
}
