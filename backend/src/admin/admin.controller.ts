import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { InquiryStatus, PriceTargetType, UserRole, UserStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Roles(UserRole.OPERATOR)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /* 회원 */
  @Get('users')
  getUsers(
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('role') role?: UserRole,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getUsers({ search, status, role, page, limit });
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.adminService.updateUserStatus(id, status);
  }

  /* 공지사항 */
  @Post('notices')
  createNotice(@Body() data: any) {
    return this.adminService.createNotice(data);
  }

  @Get('notices')
  getNotices(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getNotices(page, limit);
  }

  @Patch('notices/:id')
  updateNotice(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateNotice(id, data);
  }

  @Delete('notices/:id')
  deleteNotice(@Param('id') id: string) {
    return this.adminService.deleteNotice(id);
  }

  /* FAQ */
  @Post('faq')
  createFaq(@Body() data: any) {
    return this.adminService.createFaq(data);
  }

  @Get('faq')
  getFaqs(@Query('category') category?: string) {
    return this.adminService.getFaqs(category);
  }

  @Patch('faq/:id')
  updateFaq(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateFaq(id, data);
  }

  @Delete('faq/:id')
  deleteFaq(@Param('id') id: string) {
    return this.adminService.deleteFaq(id);
  }

  /* 1:1 문의 */
  @Get('inquiries')
  getInquiries(
    @Query('status') status?: InquiryStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getInquiries({ status, page, limit });
  }

  @Post('inquiries/:id/respond')
  respondInquiry(@Param('id') id: string, @Body('response') response: string) {
    return this.adminService.respondInquiry(id, response);
  }

  /* 운영 로그 */
  @Get('logs')
  getAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAuditLogs(page, limit);
  }

  /* 시스템 설정 */
  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings/:key')
  updateSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.adminService.updateSetting(key, value);
  }

  /* 북이오 구매 링크 관리 */
  @Get('book-offers')
  getBookOffers() {
    return this.adminService.getBookOffers();
  }

  @Post('book-offers')
  createBookOffer(@Body() data: any) {
    return this.adminService.createBookOffer(data);
  }

  @Patch('book-offers/:id')
  updateBookOffer(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateBookOffer(id, data);
  }

  @Delete('book-offers/:id')
  deleteBookOffer(@Param('id') id: string) {
    return this.adminService.deleteBookOffer(id);
  }

  /* 북이오 무료 이용권 캠페인 */
  @Get('vouchers/campaigns')
  getVoucherCampaigns() {
    return this.adminService.getVoucherCampaigns();
  }

  @Post('vouchers/campaigns')
  createVoucherCampaign(@Body() data: { name: string; courseId?: string | null; isActive?: boolean }) {
    return this.adminService.createVoucherCampaign(data);
  }

  @Patch('vouchers/campaigns/:id')
  updateVoucherCampaign(@Param('id') id: string, @Body() data: { name?: string; courseId?: string | null; isActive?: boolean }) {
    return this.adminService.updateVoucherCampaign(id, data);
  }

  @Post('vouchers/campaigns/:id/codes')
  appendVoucherCodes(@Param('id') campaignId: string, @Body('codes') codes: string[]) {
    return this.adminService.appendVoucherCodes(campaignId, codes);
  }

  @Get('vouchers/grants')
  getVoucherGrants(
    @Query('campaignId') campaignId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getVoucherGrants({ campaignId, userId, page, limit });
  }

  /* 가격 정책 */
  @Patch('pricing/:targetType/:targetId')
  updatePricingPolicy(
    @Param('targetType') targetType: PriceTargetType,
    @Param('targetId') targetId: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updatePricingPolicy(targetType, targetId, data, user.id);
  }

  @Get('pricing/history')
  getPricingHistory(
    @Query('targetType') targetType?: PriceTargetType,
    @Query('targetId') targetId?: string,
    @Query('changedById') changedById?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPricingHistory({
      targetType,
      targetId,
      changedById,
      page,
      limit,
    });
  }
}
