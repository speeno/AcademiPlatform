import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  /** 미입력 시 서버에서 임시 비밀번호 자동 생성 */
  @IsOptional()
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-z])(?=.*\d)/, {
    message: '비밀번호는 영문자와 숫자를 포함해야 합니다.',
  })
  password?: string;
}
