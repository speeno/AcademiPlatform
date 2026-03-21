import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@Controller('inquiries')
export class InquiriesController {
  constructor(private adminService: AdminService) {}

  @Post()
  createInquiry(@CurrentUser() user: any, @Body() dto: CreateInquiryDto) {
    return this.adminService.createInquiry(user.id, dto);
  }
}
