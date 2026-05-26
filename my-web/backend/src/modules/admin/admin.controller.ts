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
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { AdminUpdateFoodDto } from './dto/admin-update-food.dto';
import { BatchUpdateFoodDto } from './dto/batch-update-food.dto';

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
    @Body() body: AdminUpdateFoodDto,
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

  @Post('import-merchants')
  @UseInterceptors(FileInterceptor('file'))
  importMerchants(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload file Excel');
    }
    return this.adminService.importMerchantsFromExcel(file.buffer);
  }

  @Delete('food/:id')
  deleteFood(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteFood(id);
  }

  @Patch('food/:id/weekly-featured')
  toggleWeeklyFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body('value') value: boolean,
  ) {
    if (typeof value !== 'boolean') {
      throw new BadRequestException('value must be boolean');
    }
    return this.adminService.toggleWeeklyFeatured(id, value);
  }

  @Patch('batch-update-foods')
  batchUpdateFoods(@Body() body: BatchUpdateFoodDto) {
    return this.adminService.batchUpdateFoods(body.updates);
  }
}
