import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LmsService } from './lms.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('lms')
export class LmsController {
  constructor(private lmsService: LmsService) {}

  @Get('classroom')
  getClassroom(@CurrentUser() user: any) {
    return this.lmsService.getClassroom(user.id);
  }

  @Get('courses/:id')
  getCourseWithProgress(@Param('id') courseId: string, @CurrentUser() user: any) {
    return this.lmsService.getCourseWithProgress(courseId, user.id);
  }

  @Post('lessons/:id/progress')
  updateProgress(
    @Param('id') lessonId: string,
    @CurrentUser() user: any,
    @Body() data: { watchedSeconds?: number; isCompleted?: boolean; completionRate?: number },
  ) {
    return this.lmsService.updateProgress(lessonId, user.id, data);
  }
}
