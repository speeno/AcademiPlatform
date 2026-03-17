import {
  Body, Controller, Delete, Get, Param, Patch, Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IntroService } from './intro.service';
import { CreateIntroPageDto, CreateIntroSectionDto } from './dto/create-intro-page.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('intro')
export class IntroController {
  constructor(private introService: IntroService) {}

  /* 공개 API */
  @Public()
  @Get('pages')
  findAllPublished() {
    return this.introService.findAllPublished();
  }

  @Public()
  @Get('pages/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.introService.findBySlug(slug);
  }

  /* 관리자 API */
  @Roles(UserRole.OPERATOR)
  @Get('admin/pages')
  findAll() {
    return this.introService.findAll();
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/pages')
  create(@Body() dto: CreateIntroPageDto, @CurrentUser() user: any) {
    return this.introService.create(dto, user.id);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/pages/:id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateIntroPageDto>,
    @CurrentUser() user: any,
  ) {
    return this.introService.update(id, dto, user.id);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/pages/:id/sections')
  addSection(@Param('id') pageId: string, @Body() dto: CreateIntroSectionDto) {
    return this.introService.addSection(pageId, dto);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/sections/:id')
  updateSection(@Param('id') id: string, @Body() dto: Partial<CreateIntroSectionDto>) {
    return this.introService.updateSection(id, dto);
  }

  @Roles(UserRole.OPERATOR)
  @Delete('admin/sections/:id')
  deleteSection(@Param('id') id: string) {
    return this.introService.deleteSection(id);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/pages/:id/sections/reorder')
  reorderSections(
    @Param('id') pageId: string,
    @Body('orderedIds') orderedIds: string[],
  ) {
    return this.introService.reorderSections(pageId, orderedIds);
  }
}
