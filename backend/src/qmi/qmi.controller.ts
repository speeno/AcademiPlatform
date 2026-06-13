import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { QmiChatDto } from './dto/chat.dto';
import { CreateQmiDocumentDto, UpdateQmiDocumentDto } from './dto/document.dto';
import { QmiDocumentService } from './document.service';
import { QmiService } from './qmi.service';

@Controller('qmi')
export class QmiController {
  constructor(
    private readonly qmiService: QmiService,
    private readonly documents: QmiDocumentService,
  ) {}

  // ── 공개: 공부도우미 큐미 채팅 ─────────────────────────────────────────────
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('chat')
  chat(@Body() dto: QmiChatDto) {
    return this.qmiService.chat(dto.message);
  }

  @Public()
  @Get('starters')
  starters() {
    return { suggestions: this.qmiService.starters() };
  }

  // ── 관리자: RAG 지식 문서 관리 ─────────────────────────────────────────────
  @Roles(UserRole.OPERATOR, UserRole.SUPER_ADMIN)
  @Get('admin/documents')
  listDocuments() {
    return this.documents.list();
  }

  @Roles(UserRole.OPERATOR, UserRole.SUPER_ADMIN)
  @Post('admin/documents')
  createDocument(@Body() dto: CreateQmiDocumentDto) {
    return this.documents.create(dto);
  }

  @Roles(UserRole.OPERATOR, UserRole.SUPER_ADMIN)
  @Patch('admin/documents/:id')
  updateDocument(@Param('id') id: string, @Body() dto: UpdateQmiDocumentDto) {
    return this.documents.update(id, dto);
  }

  @Roles(UserRole.OPERATOR, UserRole.SUPER_ADMIN)
  @Delete('admin/documents/:id')
  deleteDocument(@Param('id') id: string) {
    return this.documents.remove(id);
  }

  /** 모든 문서 임베딩 재생성(OpenAI 필요) */
  @Roles(UserRole.OPERATOR, UserRole.SUPER_ADMIN)
  @Post('admin/reindex')
  async reindex() {
    const count = await this.documents.reindex();
    return { reindexed: count };
  }
}
