import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('pending-users')
  getPendingUsers() {
    return this.adminService.getPendingUsers();
  }

  @Patch('update-status/:id')
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.adminService.updateUserStatus(id, status);
  }

  @Get('all-foods')
  getAllFoods() {
    return this.adminService.getAllFoods();
  }

  @Patch('update-food/:id')
  updateFoodStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateFood(id, body);
  }

  @Get('users')
  getAllUsers(@Query('role') role?: string) {
    return this.adminService.getAllUsers(role);
  }

  @Delete('user/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Delete('food/:id')
  deleteFood(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteFood(id);
  }
}
