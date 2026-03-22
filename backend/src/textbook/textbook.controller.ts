import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { TextbookService } from './textbook.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

type AuthenticatedUser = { id: string };

@Controller('textbooks')
export class TextbookController {
  constructor(private textbookService: TextbookService) {}

  /* 사용자 API */
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.textbookService.findAll(user.id);
  }

  @Get('store')
  findStore(@CurrentUser() user: AuthenticatedUser) {
    return this.textbookService.findStore(user.id);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin')
  listAdminTextbooks() {
    return this.textbookService.listAdminTextbooks();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.textbookService.findById(id);
  }

  @Get(':id/token')
  getViewerToken(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.textbookService.getViewerToken(id, user.id);
  }

  @Get(':id/view')
  async viewPdf(
    @Param('id') id: string,
    @Query('token') viewerToken: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const buffer = await this.textbookService.streamPdf(
      id,
      viewerToken,
      user.id,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Post(':id/purchase')
  requestPurchase(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.textbookService.requestPurchase(id, user.id);
  }

  /* 관리자 API */
  @Roles(UserRole.OPERATOR)
  @Post('admin/upload-url')
  getUploadUrl(
    @Body('fileName') fileName: string,
    @Body('contentType') contentType: string,
  ) {
    return this.textbookService.getUploadPresignedUrl(fileName, contentType);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/upload-local')
  @UseInterceptors(FileInterceptor('file'))
  uploadLocalPdf(
    @UploadedFile()
    file:
      | { originalname?: string; mimetype?: string; buffer?: Buffer }
      | undefined,
  ) {
    return this.textbookService.uploadLocalPdf(file);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin')
  createTextbook(
    @Body() data: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.textbookService.createTextbook(data, user.id);
  }

  @Roles(UserRole.OPERATOR)
  @Patch('admin/:id')
  updateTextbook(@Param('id') id: string, @Body() data: unknown) {
    return this.textbookService.updateTextbook(id, data);
  }

  @Roles(UserRole.OPERATOR)
  @Post('admin/:id/grant')
  grantAccess(
    @Param('id') textbookId: string,
    @Body('userId') userId: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.textbookService.grantAccess(textbookId, userId, admin.id);
  }

  @Roles(UserRole.OPERATOR)
  @Delete('admin/:id/grant/:userId')
  revokeAccess(
    @Param('id') textbookId: string,
    @Param('userId') userId: string,
  ) {
    return this.textbookService.revokeAccess(textbookId, userId);
  }

  @Roles(UserRole.OPERATOR)
  @Get('admin/:id/logs')
  getViewLogs(
    @Param('id') textbookId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.textbookService.getViewLogs(textbookId, page, limit);
  }
}
