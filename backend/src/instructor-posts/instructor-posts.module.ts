import { Module } from '@nestjs/common';
import { InstructorPostsController } from './instructor-posts.controller';
import { InstructorPostsService } from './instructor-posts.service';

@Module({
  controllers: [InstructorPostsController],
  providers: [InstructorPostsService],
})
export class InstructorPostsModule {}
