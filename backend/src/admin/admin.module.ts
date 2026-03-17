import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PublicSettingsController } from './public-settings.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, PublicSettingsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
