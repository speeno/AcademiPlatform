import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AdminService } from './admin.service';

const PUBLIC_ALLOWED_KEYS = ['hero_banner', 'book_offers', 'shorts_gallery', 'shorts_display', 'referrer_groups', 'qualification_intros'];

@Controller('settings')
export class PublicSettingsController {
  constructor(private adminService: AdminService) {}

  @Public()
  @Get('public/:key')
  async getPublicSetting(@Param('key') key: string) {
    if (!PUBLIC_ALLOWED_KEYS.includes(key)) {
      throw new NotFoundException('설정을 찾을 수 없습니다.');
    }
    const all = await this.adminService.getSettings();
    const value = all[key];
    if (!value) return { key, value: null };
    try {
      return { key, value: JSON.parse(value) };
    } catch {
      return { key, value };
    }
  }
}
