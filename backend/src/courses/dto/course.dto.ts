import { CourseStatus } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  instructorId: string;

  @IsOptional()
  enrollmentStartAt?: string;

  @IsOptional()
  enrollmentEndAt?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  learningPeriodDays?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}

export class CourseFilterDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;

  @IsInt()
  @IsOptional()
  page?: number;

  @IsInt()
  @IsOptional()
  limit?: number;
}
