import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { maskBookOffersForPublic } from '../common/pricing/public-price-policy';
import { AdminService } from './admin.service';
import type { Response } from 'express';

const PUBLIC_ALLOWED_KEYS = [
  'hero_banner',
  'book_offers',
  'shorts_gallery',
  'shorts_display',
  'referrer_groups',
  'qualification_intros',
];

function parsePublicSettingValue(
  key: string,
  value: string | null,
  userId?: string,
) {
  if (!value) return null;
  try {
    let parsed: unknown = JSON.parse(value);
    if (key === 'book_offers') {
      parsed = maskBookOffersForPublic(parsed, userId);
    }
    return parsed;
  } catch {
    return value;
  }
}

@Controller('settings')
export class PublicSettingsController {
  constructor(private adminService: AdminService) {}

  private setCacheHeader(
    res: Response,
    hasUser: boolean,
    hasUserSpecificKey: boolean,
  ) {
    if (hasUser || hasUserSpecificKey) {
      res.setHeader('Cache-Control', 'private, max-age=30');
      res.setHeader('Vary', 'Cookie, Authorization');
      return;
    }
    res.setHeader(
      'Cache-Control',
      'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
    );
  }

  @Public()
  @Get('public/:key')
  async getPublicSetting(
    @Param('key') key: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: { id: string },
  ) {
    if (!PUBLIC_ALLOWED_KEYS.includes(key)) {
      throw new NotFoundException('설정을 찾을 수 없습니다.');
    }
    this.setCacheHeader(res, !!user?.id, key === 'book_offers');
    const value = await this.adminService.getSettingValue(key);
    return { key, value: parsePublicSettingValue(key, value, user?.id) };
  }

  @Public()
  @Get('public')
  async getPublicSettings(
    @Res({ passthrough: true }) res: Response,
    @Query('keys') keysQuery = '',
    @CurrentUser() user?: { id: string },
  ) {
    const keys = keysQuery
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
    if (keys.length === 0) return { values: {} };

    const invalid = keys.find((key) => !PUBLIC_ALLOWED_KEYS.includes(key));
    if (invalid) {
      throw new NotFoundException('설정을 찾을 수 없습니다.');
    }
    this.setCacheHeader(res, !!user?.id, keys.includes('book_offers'));

    const values = await this.adminService.getSettingValues(keys);
    return {
      values: Object.fromEntries(
        keys.map((key) => [
          key,
          parsePublicSettingValue(key, values[key] ?? null, user?.id),
        ]),
      ),
    };
  }
}
