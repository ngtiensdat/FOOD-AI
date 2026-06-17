import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtAuthOptionalGuard } from '../../common/guards/jwt-auth-optional.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { PostType, UserRole } from '@prisma/client';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  @UseGuards(JwtAuthOptionalGuard)
  async getPosts(
    @GetUser('id') viewerId?: number,
    @Query('authorId') authorIdStr?: string,
  ) {
    const authorId = authorIdStr ? parseInt(authorIdStr) : undefined;
    return this.postService.getAllPosts(viewerId, authorId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(
    @GetUser('id') userId: number,
    @Body()
    dto: {
      title?: string;
      content?: string;
      image?: string;
      rating?: number;
      postType?: PostType;
      restaurantId?: number;
      foodId?: number;
      isShared?: boolean;
      sharedFromId?: number;
    },
  ) {
    return this.postService.createPost(userId, dto);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postService.toggleLike(userId, postId);
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) postId: number,
    @Body() dto: { content: string; parentId?: number },
  ) {
    return this.postService.createComment(userId, postId, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @GetUser('id') userId: number,
    @GetUser('role') role: UserRole,
    @Param('id', ParseIntPipe) commentId: number,
  ) {
    return this.postService.deleteComment(userId, role, commentId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @GetUser('id') userId: number,
    @GetUser('role') role: UserRole,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postService.deletePost(userId, role, postId);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  async toggleSave(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postService.toggleSavePost(userId, postId);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  async getSaved(@GetUser('id') userId: number) {
    return this.postService.getSavedPosts(userId);
  }
}
