import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IntroPageStatus } from '@prisma/client';

export class CreateIntroPageDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  ogTitle?: string;

  @IsString()
  @IsOptional()
  ogDescription?: string;

  @IsString()
  @IsOptional()
  ogImage?: string;

  @IsEnum(IntroPageStatus)
  @IsOptional()
  status?: IntroPageStatus;
}

export class CreateIntroSectionDto {
  @IsString()
  sectionType: string;

  @IsString()
  @IsOptional()
  title?: string;

  contentJson: object;

  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  isVisible?: boolean;
}
