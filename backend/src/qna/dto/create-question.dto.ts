import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  courseId: string;

  @IsString()
  assignedInstructorId: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
