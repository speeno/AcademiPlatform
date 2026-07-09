import { IsOptional, IsString } from 'class-validator';

export class GrantTrainingPermissionDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  note?: string;
}
