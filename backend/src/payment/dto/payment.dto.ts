import { PaymentTarget } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsEnum(PaymentTarget)
  targetType: PaymentTarget;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  imp_uid: string;

  @IsString()
  @IsNotEmpty()
  merchant_uid: string;
}

export class PaymentWebhookDto {
  @IsString()
  @IsNotEmpty()
  imp_uid: string;

  @IsString()
  @IsNotEmpty()
  merchant_uid: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}

export class RefundPaymentDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
