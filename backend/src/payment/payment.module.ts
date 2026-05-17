import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PortoneWebhookGuard } from './guards/portone-webhook.guard';
import { CoursesModule } from '../courses/courses.module';
import { PaymentPricingService } from './services/payment-pricing.service';
import { PortOneClient } from './services/portone.client';
import { PaymentPostProcessor } from './services/payment-post-processor.service';

@Module({
  imports: [CoursesModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PortoneWebhookGuard,
    PaymentPricingService,
    PortOneClient,
    PaymentPostProcessor,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
