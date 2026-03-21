import { CmsCollaboratorRole, CmsContentType, CmsReviewStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertCollaboratorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsEnum(CmsCollaboratorRole)
  role?: CmsCollaboratorRole;
}

export class SaveLessonContentDto {
  @IsEnum(CmsContentType)
  contentType: CmsContentType;

  @IsObject()
  schemaJson: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  changeNote?: string;
}

export class UploadUrlDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;
}

export class ReviewDecisionDto {
  @IsEnum(CmsReviewStatus)
  status: CmsReviewStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectReason?: string;
}
