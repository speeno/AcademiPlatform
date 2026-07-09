import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TrainingPermissionService } from './training-permission.service';
import { GrantTrainingPermissionDto } from './dto/training-permission.dto';

@Roles(UserRole.OPERATOR)
@Controller('training/admin')
export class TrainingAdminController {
  constructor(private permissionService: TrainingPermissionService) {}

  @Get('permissions')
  listPermissions() {
    return this.permissionService.listGrants();
  }

  @Post('permissions')
  grantPermission(
    @Body() dto: GrantTrainingPermissionDto,
    @CurrentUser() user: any,
  ) {
    return this.permissionService.grant(dto.userId, user.id, dto.note);
  }

  @Delete('permissions/:userId')
  revokePermission(@Param('userId') userId: string) {
    return this.permissionService.revoke(userId);
  }
}
