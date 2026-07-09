import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class IssueTrainingCertificatesDto {
  @IsArray()
  @ArrayNotEmpty({ message: '발급 대상을 선택해주세요.' })
  @IsString({ each: true })
  participantIds: string[];
}

export class RevokeTrainingCertificateDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
