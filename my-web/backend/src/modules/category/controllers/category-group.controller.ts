import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CategoryGroupService } from '../services/category-group.service';
import {
  CreateCategoryGroupDto,
  UpdateCategoryGroupDto,
} from '../dto/category-group.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('merchant/category-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT)
export class CategoryGroupController {
  constructor(private readonly categoryGroupService: CategoryGroupService) {}

  @Post()
  async create(
    @GetUser('id') restaurantId: number,
    @Body() dto: CreateCategoryGroupDto,
  ) {
    const data = await this.categoryGroupService.create(restaurantId, dto);
    return { data };
  }

  @Get()
  async findAll(@GetUser('id') restaurantId: number) {
    const data =
      await this.categoryGroupService.findAllByRestaurantId(restaurantId);
    return { data };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') restaurantId: number,
    @Body() dto: UpdateCategoryGroupDto,
  ) {
    const data = await this.categoryGroupService.update(id, restaurantId, dto);
    return { data };
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') restaurantId: number,
  ) {
    const data = await this.categoryGroupService.delete(id, restaurantId);
    return { data };
  }
}
