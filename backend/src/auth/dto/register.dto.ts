import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-z])(?=.*\d)/, { message: '비밀번호는 영문자와 숫자를 포함해야 합니다.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  name: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsNotEmpty({ message: '이용약관에 동의해주세요.' })
  agreedTerms: string;

  @IsString()
  @IsNotEmpty({ message: '개인정보 수집에 동의해주세요.' })
  agreedPrivacy: string;
}
