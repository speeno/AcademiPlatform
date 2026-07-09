import { TrainingProgramStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateTrainingProgramDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @Matches(DATE_REGEX, { message: '시작일은 YYYY-MM-DD 형식이어야 합니다.' })
  startDate: string;

  @Matches(DATE_REGEX, { message: '종료일은 YYYY-MM-DD 형식이어야 합니다.' })
  endDate: string;
}

export class UpdateTrainingProgramDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  courseId?: string | null;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number | null;

  @Matches(DATE_REGEX, { message: '시작일은 YYYY-MM-DD 형식이어야 합니다.' })
  @IsOptional()
  startDate?: string;

  @Matches(DATE_REGEX, { message: '종료일은 YYYY-MM-DD 형식이어야 합니다.' })
  @IsOptional()
  endDate?: string;

  @IsEnum(TrainingProgramStatus)
  @IsOptional()
  status?: TrainingProgramStatus;
}

export class TrainingProgramFilterDto {
  @IsEnum(TrainingProgramStatus)
  @IsOptional()
  status?: TrainingProgramStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
