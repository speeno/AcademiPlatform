import { TrainingAttendanceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AttendanceRecordDto {
  @IsString()
  participantId: string;

  @IsEnum(TrainingAttendanceStatus)
  status: TrainingAttendanceStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

export class BulkUpsertAttendanceDto {
  @IsArray()
  @ArrayNotEmpty({ message: '출석 기록이 비어 있습니다.' })
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
