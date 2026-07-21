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
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import * as PrismaClient from '@prisma/client';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  ImportIngredientDto,
} from './dto/ingredient.dto';
import { BulkCreateIngredientDto } from './dto/bulk-create-ingredient.dto';
import { UpdateRecipeDto } from './dto/recipe.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PrismaClient.UserRole.RESTAURANT, PrismaClient.UserRole.STAFF)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Helper xác thực và trả về restaurantId hợp lệ từ user hiện tại.
   * Logic này được ủy quyền cho InventoryService để tuân thủ SRP.
   */
  private async getActiveRestaurantId(
    user: PrismaClient.User,
    explicitId?: string,
  ): Promise<number> {
    return this.inventoryService.resolveRestaurantId(user, explicitId);
  }

  // --- CRUD Nguyên liệu ---

  @Get('ingredients')
  async getIngredients(
    @GetUser() user: PrismaClient.User,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.getIngredients(activeId);
  }

  @Post('ingredients')
  async createIngredient(
    @GetUser() user: PrismaClient.User,
    @Body() dto: CreateIngredientDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.createIngredient(activeId, dto);
  }

  @Post('ingredients/bulk')
  async createBulkIngredients(
    @GetUser() user: PrismaClient.User,
    @Body() dto: BulkCreateIngredientDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.createBulk(activeId, dto);
  }

  @Patch('ingredients/:id')
  async updateIngredient(
    @Param('id') id: string,
    @GetUser() user: PrismaClient.User,
    @Body() dto: UpdateIngredientDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.updateIngredient(id, activeId, dto);
  }

  @Delete('ingredients/:id')
  async deleteIngredient(
    @Param('id') id: string,
    @GetUser() user: PrismaClient.User,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.deleteIngredient(id, activeId);
  }

  // --- Nhập kho ---

  @Post('ingredients/import')
  async importIngredient(
    @GetUser() user: PrismaClient.User,
    @Body() dto: ImportIngredientDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.importIngredient(activeId, dto);
  }

  // --- Định lượng quy đổi (Recipes) ---

  @Get('recipes')
  async getRecipes(
    @GetUser() user: PrismaClient.User,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.getRecipes(activeId);
  }

  @Post('recipes')
  async updateRecipe(
    @GetUser() user: PrismaClient.User,
    @Body() dto: UpdateRecipeDto,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.updateRecipe(activeId, dto);
  }

  // --- Nhật ký biến động (Logs) ---

  @Get('logs')
  async getLogs(
    @GetUser() user: PrismaClient.User,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const activeId = await this.getActiveRestaurantId(user, restaurantId);
    return this.inventoryService.getLogs(activeId);
  }
}
