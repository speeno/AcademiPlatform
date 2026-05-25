import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AssignmentSubmissionStatus } from '@prisma/client';

export class AdminCreateAssignmentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsBoolean()
  allowResubmit?: boolean;

  @IsOptional()
  @IsBoolean()
  allowLateSubmit?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxFileSizeMb?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];
}

export class AdminUpdateAssignmentDto extends AdminCreateAssignmentDto {}

export class SubmitAssignmentDto {
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}

export class AdminReviewAssignmentSubmissionDto {
  @IsString()
  status!: AssignmentSubmissionStatus;

  @IsOptional()
  @IsString()
  feedback?: string;
}
