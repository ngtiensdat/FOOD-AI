import {
  Controller,
  Get,
  Post,
  Patch,
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
import { UserRole } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  @UseGuards(JwtAuthOptionalGuard)
  async getPosts(
    @GetUser('id') viewerId?: number,
    @Query('authorId') authorIdStr?: string,
    @Query('_t') timestamp?: string,
  ) {
    const authorId = authorIdStr ? parseInt(authorIdStr) : undefined;
    const noCache = !!timestamp; // bypass cache khi có timestamp
    return this.postService.getAllPosts(
      viewerId,
      authorId,
      1,
      undefined,
      noCache,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(@GetUser('id') userId: number, @Body() dto: CreatePostDto) {
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
    @Body() dto: CreateCommentDto,
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @GetUser('id') userId: number,
    @GetUser('role') role: UserRole,
    @Param('id', ParseIntPipe) postId: number,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postService.updatePost(userId, role, postId, dto);
  }
}
