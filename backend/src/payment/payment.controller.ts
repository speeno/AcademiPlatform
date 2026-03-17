import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentStatus, UserRole } from '@prisma/client';
import { PaymentService } from './payment.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateOrderDto,
  PaymentWebhookDto,
  RefundPaymentDto,
  VerifyPaymentDto,
} from './dto/payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('orders')
  createOrder(
    @CurrentUser() user: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.paymentService.createOrder(user.id, dto.targetType, dto.targetId, dto.amount);
  }

  @Post('verify')
  verify(
    @CurrentUser() user: any,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentService.verifyAndComplete(user.id, dto.imp_uid, dto.merchant_uid);
  }

  @Public()
  @Post('webhook')
  webhook(@Body() body: PaymentWebhookDto) {
    return this.paymentService.handleWebhook(body);
  }

  @Get('my')
  getMyPayments(@CurrentUser() user: any) {
    return this.paymentService.getMyPayments(user.id);
  }

  @Post(':id/refund')
  requestRefund(
    @Param('id') paymentId: string,
    @CurrentUser() user: any,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentService.requestRefund(paymentId, user.id, dto.reason ?? '');
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin')
  getPayments(
    @Query('status') status?: PaymentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentService.getPayments({ status, page, limit });
  }
}
