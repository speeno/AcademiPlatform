import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InstructorPostsService } from './instructor-posts.service';

@Roles(UserRole.INSTRUCTOR)
@Controller('instructor-posts')
export class InstructorPostsController {
  constructor(private svc: InstructorPostsService) {}

  @Get()
  list(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.list(Number(page), Number(limit));
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() body: { title: string; content: string; isPinned?: boolean },
  ) {
    return this.svc.create(user.id, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() body: { title?: string; content?: string; isPinned?: boolean; isPublished?: boolean },
  ) {
    return this.svc.update(id, user.id, user.role, body);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.svc.remove(id, user.id, user.role);
  }
}
