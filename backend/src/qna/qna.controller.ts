import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { QnaQuestionStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QnaService } from './qna.service';

@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  @Roles(UserRole.USER)
  @Get('courses/:courseId/instructors')
  getCourseInstructors(
    @Param('courseId') courseId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.qnaService.getCourseAssignableInstructors(courseId, user.id);
  }

  @Roles(UserRole.USER)
  @Post('questions')
  createQuestion(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateQuestionDto,
  ) {
    return this.qnaService.createQuestion(user.id, dto);
  }

  @Roles(UserRole.USER)
  @Get('my-questions')
  getMyQuestions(
    @CurrentUser() user: { id: string },
    @Query('courseId') courseId?: string,
  ) {
    return this.qnaService.getMyQuestions(user.id, courseId);
  }

  @Roles(UserRole.USER)
  @Get('my-questions/:id')
  getMyQuestionDetail(
    @CurrentUser() user: { id: string },
    @Param('id') questionId: string,
  ) {
    return this.qnaService.getMyQuestionDetail(user.id, questionId);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Get('instructor/questions')
  getInstructorQuestions(
    @CurrentUser() user: { id: string },
    @Query('status') status?: QnaQuestionStatus,
    @Query('courseId') courseId?: string,
  ) {
    return this.qnaService.getInstructorQuestions(user.id, status, courseId);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Post('questions/:id/answers')
  answerQuestion(
    @CurrentUser() user: { id: string },
    @Param('id') questionId: string,
    @Body() dto: CreateAnswerDto,
  ) {
    return this.qnaService.answerQuestion(user.id, questionId, dto);
  }
}
