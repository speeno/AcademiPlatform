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
} from '@nestjs/common';
import { CourseStatus, LessonType, UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  CourseFilterDto,
  UpdateCourseDto,
} from './dto/course.dto';
import { AddLessonDto } from './dto/lesson.dto';
import {
  AdminCreateAssignmentDto,
  AdminReviewAssignmentSubmissionDto,
  AdminUpdateAssignmentDto,
  SubmitAssignmentDto,
} from './dto/assignment.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Response } from 'express';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  private setPublicCacheHeader(res: Response, hasUser: boolean) {
    if (hasUser) {
      res.setHeader('Cache-Control', 'private, max-age=30');
      res.setHeader('Vary', 'Cookie, Authorization');
      return;
    }
    res.setHeader(
      'Cache-Control',
      'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
    );
  }

  /* 공개 API */
  @Public()
  @Get()
  findAll(
    @Query() filter: CourseFilterDto,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: { id: string },
  ) {
    this.setPublicCacheHeader(res, !!user?.id);
    return this.coursesService.findAll(filter, user?.id);
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.coursesService.getCategories();
  }

  /* 수강 등록 */
  @Post(':id/enroll')
  enroll(
    @Param('id') courseId: string,
    @CurrentUser() user: any,
    @Body('paymentId') paymentId?: string,
  ) {
    return this.coursesService.enroll(courseId, user.id, paymentId);
  }

  @Get('my/enrollments')
  getMyEnrollments(@CurrentUser() user: any) {
    return this.coursesService.getMyEnrollments(user.id);
  }

  @Get('my/courses/:id/assignments')
  getMyAssignments(@Param('id') courseId: string, @CurrentUser() user: any) {
    return this.coursesService.getMyAssignments(courseId, user.id);
  }

  @Get('my/assignments/:assignmentId/submission')
  getMyAssignmentSubmission(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.getMyAssignmentSubmission(assignmentId, user.id);
  }

  @Post('my/assignments/:assignmentId/submission')
  submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.coursesService.submitAssignment(assignmentId, user.id, dto);
  }

  /* 관리자 API */
  @Roles(UserRole.OPERATOR)
  @Get('admin/list')
  getAdminList(
    @Query('status') status?: CourseStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.coursesService.getAdminCourses({ status, search, page, limit });
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin')
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/:id')
  getForAdmin(@Param('id') id: string) {
    return this.coursesService.getCourseForAdmin(id);
  }

  @Roles(UserRole.OPERATOR)
  @Delete('admin/:id')
  delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/:id/enrollments')
  getAdminEnrollments(@Param('id') courseId: string) {
    return this.coursesService.getAdminEnrollments(courseId);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/:id/enrollments')
  addEnrollment(
    @Param('id') courseId: string,
    @CurrentUser() user: any,
    @Body('userId') targetUserId: string,
  ) {
    return this.coursesService.addEnrollmentByAdmin(
      courseId,
      targetUserId,
      user.id,
    );
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/:id/assignments')
  getAdminAssignments(@Param('id') courseId: string) {
    return this.coursesService.getAdminAssignments(courseId);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/:id/assignments')
  createAdminAssignment(
    @Param('id') courseId: string,
    @Body() dto: AdminCreateAssignmentDto,
  ) {
    return this.coursesService.createAssignment(courseId, dto);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/:id/assignments/:assignmentId')
  updateAdminAssignment(
    @Param('id') courseId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: AdminUpdateAssignmentDto,
  ) {
    return this.coursesService.updateAssignment(courseId, assignmentId, dto);
  }

  @Roles(UserRole.OPERATOR)
  @Delete('admin/:id/assignments/:assignmentId')
  deleteAdminAssignment(
    @Param('id') courseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.coursesService.deleteAssignment(courseId, assignmentId);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/:id/assignments/:assignmentId/submissions')
  getAdminAssignmentSubmissions(
    @Param('id') courseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.coursesService.getAssignmentSubmissions(courseId, assignmentId);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/:id/assignments/:assignmentId/submissions/:submissionId')
  reviewAdminAssignmentSubmission(
    @Param('id') courseId: string,
    @Param('assignmentId') assignmentId: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: AdminReviewAssignmentSubmissionDto,
  ) {
    return this.coursesService.reviewAssignmentSubmission(
      courseId,
      assignmentId,
      submissionId,
      dto,
    );
  }

  @Public()
  @Get(':slug')
  findBySlug(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: { id: string },
  ) {
    this.setPublicCacheHeader(res, !!user?.id);
    return this.coursesService.findBySlug(slug, user?.id);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Post('admin/:id/modules')
  addModule(
    @Param('id') courseId: string,
    @Body('title') title: string,
    @Body('sortOrder') sortOrder?: number,
  ) {
    return this.coursesService.addModule(courseId, title);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Post('admin/modules/:moduleId/lessons')
  addLesson(@Param('moduleId') moduleId: string, @Body() data: AddLessonDto) {
    return this.coursesService.addLesson(moduleId, data);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Patch('admin/:id/modules/:moduleId')
  updateModule(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @Body() data: { title?: string; sortOrder?: number },
  ) {
    return this.coursesService.updateModule(id, moduleId, data);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Patch('admin/modules/:moduleId/lessons/:lessonId')
  updateLesson(
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Body()
    data: {
      title?: string;
      lessonType?: LessonType;
      description?: string;
      sortOrder?: number;
      isPreview?: boolean;
    },
  ) {
    return this.coursesService.updateLesson(moduleId, lessonId, data);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Delete('admin/:id/modules/:moduleId')
  deleteModule(@Param('id') id: string, @Param('moduleId') moduleId: string) {
    return this.coursesService.deleteModule(id, moduleId);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Delete('admin/modules/:moduleId/lessons/:lessonId')
  deleteLesson(
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.coursesService.deleteLesson(moduleId, lessonId);
  }
}
