import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateTrainingSessionDto {
  @Matches(DATE_REGEX, { message: '날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  date: string;

  @Matches(TIME_REGEX, { message: '시작 시간은 HH:mm 형식이어야 합니다.' })
  startTime: string;

  @Matches(TIME_REGEX, { message: '종료 시간은 HH:mm 형식이어야 합니다.' })
  endTime: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

// 달력 드래그 선택으로 여러 날짜에 동일 시간대 회차를 한 번에 등록
export class BulkCreateTrainingSessionsDto {
  @IsArray()
  @ArrayNotEmpty({ message: '등록할 날짜를 선택해주세요.' })
  @Matches(DATE_REGEX, {
    each: true,
    message: '날짜는 YYYY-MM-DD 형식이어야 합니다.',
  })
  dates: string[];

  @Matches(TIME_REGEX, { message: '시작 시간은 HH:mm 형식이어야 합니다.' })
  startTime: string;

  @Matches(TIME_REGEX, { message: '종료 시간은 HH:mm 형식이어야 합니다.' })
  endTime: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateTrainingSessionDto {
  @Matches(DATE_REGEX, { message: '날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  @IsOptional()
  date?: string;

  @Matches(TIME_REGEX, { message: '시작 시간은 HH:mm 형식이어야 합니다.' })
  @IsOptional()
  startTime?: string;

  @Matches(TIME_REGEX, { message: '종료 시간은 HH:mm 형식이어야 합니다.' })
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  location?: string;
}
