import {
  Body, Controller, Get, Headers, Param, Post, Query, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { MediaService } from './media.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  // 강의 영상 스트림 토큰 발급
  @Get('lessons/:id/stream-token')
  getStreamToken(@Param('id') lessonId: string, @CurrentUser() user: any) {
    return this.mediaService.getStreamToken(lessonId, user.id);
  }

  // HLS AES-128 키 서버 엔드포인트
  @Get('hls-key/:keyId')
  async getHlsKey(
    @Param('keyId') keyId: string,
    @Query('token') sessionToken: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const keyBytes = await this.mediaService.getHlsKey(keyId, user.id, sessionToken);
    res.set('Content-Type', 'application/octet-stream');
    res.send(keyBytes);
  }

  // 재생 세션 핑 (30초마다 프론트에서 호출)
  @Post('sessions/ping')
  pingSession(@Body('sessionToken') token: string, @CurrentUser() user: any) {
    return this.mediaService.pingSession(token, user.id);
  }

  // 관리자: S3 업로드 Presigned URL 발급
  @Roles(UserRole.INSTRUCTOR)
  @Post('lessons/:id/upload')
  getUploadUrl(
    @Param('id') lessonId: string,
    @Body('fileName') fileName: string,
    @Body('contentType') contentType: string,
  ) {
    return this.mediaService.getUploadPresignedUrl(lessonId, fileName, contentType);
  }
}
