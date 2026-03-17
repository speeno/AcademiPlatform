import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CourseFilterDto, UpdateCourseDto } from './dto/course.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  /* 공개 API */
  @Public()
  @Get()
  findAll(@Query() filter: CourseFilterDto) {
    return this.coursesService.findAll(filter);
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.coursesService.getCategories();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
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

  /* 관리자 API */
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

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Post('admin/:id/modules')
  addModule(@Param('id') courseId: string, @Body('title') title: string, @Body('sortOrder') sortOrder?: number) {
    return this.coursesService.addModule(courseId, title);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Post('admin/modules/:moduleId/lessons')
  addLesson(@Param('moduleId') moduleId: string, @Body() data: any) {
    return this.coursesService.addLesson(moduleId, data);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Delete('admin/:id/modules/:moduleId')
  deleteModule(@Param('id') id: string, @Param('moduleId') moduleId: string) {
    return this.coursesService.deleteModule(id, moduleId);
  }

  @Roles(UserRole.OPERATOR, UserRole.INSTRUCTOR)
  @Delete('admin/modules/:moduleId/lessons/:lessonId')
  deleteLesson(@Param('moduleId') moduleId: string, @Param('lessonId') lessonId: string) {
    return this.coursesService.deleteLesson(moduleId, lessonId);
  }
}
