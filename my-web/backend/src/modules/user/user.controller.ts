import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Body,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtAuthOptionalGuard } from '../../common/guards/jwt-auth-optional.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile/:id')
  async getProfile(
    @Param('id') id: string,
    @Query('requesterId') requesterId?: string,
  ) {
    return this.userService.getProfile(
      parseInt(id),
      requesterId ? parseInt(requesterId) : undefined,
    );
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @GetUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Post('toggle-follow-user')
  @UseGuards(JwtAuthGuard)
  async toggleFollowUser(
    @GetUser('id') userId: number,
    @Body() body: { followingId: number },
  ) {
    return this.userService.toggleFollow(userId, body.followingId);
  }

  @Get('followers/:id')
  @UseGuards(JwtAuthOptionalGuard)
  async getFollowers(@Param('id') id: string, @GetUser('id') userId?: number) {
    return this.userService.getFollowers(parseInt(id), userId);
  }

  @Get('following/:id')
  @UseGuards(JwtAuthOptionalGuard)
  async getFollowing(@Param('id') id: string, @GetUser('id') userId?: number) {
    return this.userService.getFollowing(parseInt(id), userId);
  }
}
