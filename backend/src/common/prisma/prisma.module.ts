import { Global, Module } from '@nestjs/common';
import { DbKeepAliveService } from './db-keepalive.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, DbKeepAliveService],
  exports: [PrismaService],
})
export class PrismaModule {}
