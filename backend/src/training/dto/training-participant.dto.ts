import { TrainingParticipantStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

// 회원 등록({userId}) 또는 비회원 직접 등록({name, ...}) 겸용.
// 둘 중 어느 쪽인지는 서비스에서 검증한다(userId 또는 name 필수).
export class AddTrainingParticipantDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  affiliation?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsBoolean()
  @IsOptional()
  allowOverCapacity?: boolean;
}

export class UpdateTrainingParticipantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  affiliation?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(TrainingParticipantStatus)
  @IsOptional()
  status?: TrainingParticipantStatus;
}
