import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InventoryPrismaService } from '../../database/inventory-prisma.service';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  ImportIngredientDto,
} from './dto/ingredient.dto';
import { BulkCreateIngredientDto } from './dto/bulk-create-ingredient.dto';
import { UpdateRecipeDto } from './dto/recipe.dto';
import { LIMITS } from '../../common/constants/limits.constant';
import { User, UserRole } from '@prisma/client';

/** Một nguyên liệu trong công thức của món ăn */
export interface RecipeGroupItem {
  recipeItemId: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  usedQuantity: number;
}

/** Nhóm công thức theo từng món ăn */
export interface RecipeGroupEntry {
  foodId: number;
  foodName: string;
  price: number;
  items: RecipeGroupItem[];
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService, // Postgres (Main DB)
    private readonly inventoryPrisma: InventoryPrismaService, // SQLite (Inventory DB)
  ) {}

  // --- Branch Ownership Resolution (moved from Controller to Service for SRP) ---

  /**
   * Xác thực và trả về restaurantId hợp lệ dựa theo vai trò user.
   * STAFF: tự động lấy chi nhánh hiện tại đang được gán.
   * RESTAURANT (Owner): kiểm tra quyền sở hữu theo explicit restaurantId.
   */
  async resolveRestaurantId(user: User, explicitId?: string): Promise<number> {
    if (user.role === UserRole.STAFF) {
      if (!user.restaurantId) {
        throw new ForbiddenException(
          'Nhân viên chưa được gán chi nhánh làm việc.',
        );
      }
      return user.restaurantId;
    }

    const parsedId = explicitId ? parseInt(explicitId, 10) : NaN;
    if (isNaN(parsedId)) {
      throw new ForbiddenException(
        'Vui lòng cung cấp mã chi nhánh (restaurantId).',
      );
    }

    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: parsedId, ownerId: user.id },
    });
    if (!restaurant) {
      throw new ForbiddenException(
        'Bạn không sở hữu hoặc không có quyền quản lý chi nhánh này.',
      );
    }

    return parsedId;
  }

  // --- Raw Ingredients CRUD ---

  async getIngredients(restaurantId: number) {
    return this.inventoryPrisma.ingredient.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });
  }

  async createIngredient(restaurantId: number, dto: CreateIngredientDto) {
    return this.inventoryPrisma.ingredient.create({
      data: {
        restaurantId,
        name: dto.name,
        sku: dto.sku,
        quantity: dto.quantity ?? 0.0,
        unit: dto.unit,
        minStock: dto.minStock ?? 0.0,
      },
    });
  }

  async updateIngredient(
    id: string,
    restaurantId: number,
    dto: UpdateIngredientDto,
  ) {
    const ingredient = await this.inventoryPrisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException('Không tìm thấy nguyên liệu');
    }
    if (ingredient.restaurantId !== restaurantId) {
      throw new ForbiddenException('Không có quyền thay đổi nguyên liệu này');
    }

    return this.inventoryPrisma.ingredient.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        quantity: dto.quantity,
        unit: dto.unit,
        minStock: dto.minStock,
      },
    });
  }

  async deleteIngredient(id: string, restaurantId: number) {
    const ingredient = await this.inventoryPrisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException('Không tìm thấy nguyên liệu');
    }
    if (ingredient.restaurantId !== restaurantId) {
      throw new ForbiddenException('Không có quyền xóa nguyên liệu này');
    }

    await this.inventoryPrisma.ingredient.delete({
      where: { id },
    });

    return { success: true };
  }

  // --- Nhập kho (Import) ---

  async importIngredient(restaurantId: number, dto: ImportIngredientDto) {
    const ingredient = await this.inventoryPrisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundException('Không tìm thấy nguyên liệu');
    }
    if (ingredient.restaurantId !== restaurantId) {
      throw new ForbiddenException(
        'Không có quyền nhập kho cho nguyên liệu này',
      );
    }

    // Update quantity and record log
    return this.inventoryPrisma.$transaction(async (tx) => {
      const updated = await tx.ingredient.update({
        where: { id: dto.ingredientId },
        data: {
          quantity: {
            increment: dto.quantity,
          },
        },
      });

      await tx.inventoryLog.create({
        data: {
          ingredientId: dto.ingredientId,
          type: 'IMPORT',
          quantity: dto.quantity,
          note: dto.note || 'Nhập kho nguyên vật liệu',
        },
      });

      return updated;
    });
  }

  // --- Recipe & Conversion ---

  async getRecipes(restaurantId: number) {
    // 1. Get recipes from SQLite
    const recipes = await this.inventoryPrisma.recipeItem.findMany({
      where: {
        ingredient: {
          restaurantId,
        },
      },
      include: {
        ingredient: true,
      },
    });

    // 2. Fetch food names from PG DB
    const foodIds = [...new Set(recipes.map((r) => r.foodId))];
    const foods = await this.prisma.food.findMany({
      where: {
        id: { in: foodIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    const foodMap = new Map(foods.map((f) => [f.id, f]));

    // 3. Group recipe items by foodId
    const grouped: Record<number, RecipeGroupEntry> = {};

    // Initialize with all foods from main DB under this restaurant
    // so merchant can see all menu foods even if they don't have recipes yet.
    const allRestaurantFoods = await this.prisma.food.findMany({
      where: {
        restaurantId,
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    for (const food of allRestaurantFoods) {
      grouped[food.id] = {
        foodId: food.id,
        foodName: food.name,
        price: food.price,
        items: [],
      };
    }

    for (const r of recipes) {
      const foodInfo = foodMap.get(r.foodId);
      if (grouped[r.foodId]) {
        grouped[r.foodId].items.push({
          recipeItemId: r.id,
          ingredientId: r.ingredientId,
          ingredientName: r.ingredient.name,
          unit: r.ingredient.unit,
          usedQuantity: r.usedQuantity,
        });
      } else if (foodInfo) {
        grouped[r.foodId] = {
          foodId: r.foodId,
          foodName: foodInfo.name,
          price: foodInfo.price,
          items: [
            {
              recipeItemId: r.id,
              ingredientId: r.ingredientId,
              ingredientName: r.ingredient.name,
              unit: r.ingredient.unit,
              usedQuantity: r.usedQuantity,
            },
          ],
        };
      }
    }

    return Object.values(grouped);
  }

  async updateRecipe(restaurantId: number, dto: UpdateRecipeDto) {
    // 1. Verify the food item belongs to the restaurant
    const food = await this.prisma.food.findUnique({
      where: { id: dto.foodId },
    });

    if (!food) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }
    if (food.restaurantId !== restaurantId) {
      throw new ForbiddenException('Món ăn không thuộc chi nhánh quản lý');
    }

    // 2. Verify all ingredients belong to the restaurant
    if (dto.items.length > 0) {
      const ingredientIds = dto.items.map((i) => i.ingredientId);
      const ingredients = await this.inventoryPrisma.ingredient.findMany({
        where: {
          id: { in: ingredientIds },
          restaurantId,
        },
      });

      if (ingredients.length !== ingredientIds.length) {
        throw new ForbiddenException(
          'Có nguyên liệu không hợp lệ hoặc không thuộc chi nhánh',
        );
      }
    }

    // 3. Clear old recipe items for this food and insert new ones
    await this.inventoryPrisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({
        where: { foodId: dto.foodId },
      });

      if (dto.items.length > 0) {
        await tx.recipeItem.createMany({
          data: dto.items.map((item) => ({
            foodId: dto.foodId,
            ingredientId: item.ingredientId,
            usedQuantity: item.usedQuantity,
          })),
        });
      }
    });

    return { success: true };
  }

  async createBulk(restaurantId: number, dto: BulkCreateIngredientDto) {
    const dataToInsert = dto.ingredients.map((ing) => ({
      restaurantId,
      name: ing.name,
      sku: ing.sku || null,
      quantity: ing.quantity ?? 0.0,
      unit: ing.unit,
      minStock: ing.minStock ?? 0.0,
    }));

    const result = await this.inventoryPrisma.ingredient.createMany({
      data: dataToInsert,
    });
    return { count: result.count };
  }

  // --- Audit Logs ---

  async getLogs(restaurantId: number) {
    return this.inventoryPrisma.inventoryLog.findMany({
      where: {
        ingredient: {
          restaurantId,
        },
      },
      include: {
        ingredient: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: LIMITS.INVENTORY_LOG_LIMIT,
    });
  }
}
