import { apiClient } from '@/lib/api-client';

export interface Ingredient {
  id: string;
  restaurantId: number;
  name: string;
  sku: string | null;
  quantity: number;
  unit: string;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeItem {
  recipeItemId: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  usedQuantity: number;
}

export interface RecipeGroup {
  foodId: number;
  foodName: string;
  price: number;
  items: RecipeItem[];
}

export interface InventoryLog {
  id: string;
  ingredientId: string;
  type: 'IMPORT' | 'ORDER_DEDUCTION' | 'ADJUSTMENT' | 'WASTE';
  quantity: number;
  note: string | null;
  createdAt: string;
  ingredient: Ingredient;
}

export const inventoryService = {
  async getIngredients(restaurantId?: number): Promise<Ingredient[]> {
    const url = restaurantId ? `/inventory/ingredients?restaurantId=${restaurantId}` : '/inventory/ingredients';
    return apiClient.get(url);
  },

  async createIngredient(
    data: { name: string; sku?: string; quantity?: number; unit: string; minStock?: number },
    restaurantId?: number
  ): Promise<Ingredient> {
    const url = restaurantId ? `/inventory/ingredients?restaurantId=${restaurantId}` : '/inventory/ingredients';
    return apiClient.post(url, data);
  },

  async updateIngredient(
    id: string,
    data: { name?: string; sku?: string; quantity?: number; unit?: string; minStock?: number },
    restaurantId?: number
  ): Promise<Ingredient> {
    const url = restaurantId ? `/inventory/ingredients/${id}?restaurantId=${restaurantId}` : `/inventory/ingredients/${id}`;
    return apiClient.patch(url, data);
  },

  async deleteIngredient(id: string, restaurantId?: number): Promise<{ success: boolean }> {
    const url = restaurantId ? `/inventory/ingredients/${id}?restaurantId=${restaurantId}` : `/inventory/ingredients/${id}`;
    return apiClient.delete(url);
  },

  async importIngredient(
    data: { ingredientId: string; quantity: number; note?: string },
    restaurantId?: number
  ): Promise<Ingredient> {
    const url = restaurantId ? `/inventory/ingredients/import?restaurantId=${restaurantId}` : '/inventory/ingredients/import';
    return apiClient.post(url, data);
  },

  async createBulkIngredients(
    data: {
      restaurantId: number;
      ingredients: { name: string; sku?: string; quantity?: number; unit: string; minStock?: number }[];
    },
    restaurantId?: number
  ): Promise<{ success: boolean; count: number }> {
    const url = restaurantId ? `/inventory/ingredients/bulk?restaurantId=${restaurantId}` : '/inventory/ingredients/bulk';
    try {
      const res = (await apiClient.post(url, data)) as any;
      return { success: true, count: res?.count || data.ingredients.length };
    } catch (e) {
      console.error(e);
      return { success: false, count: 0 };
    }
  },

  async getRecipes(restaurantId?: number): Promise<RecipeGroup[]> {
    const url = restaurantId ? `/inventory/recipes?restaurantId=${restaurantId}` : '/inventory/recipes';
    return apiClient.get(url);
  },

  async updateRecipe(
    data: { foodId: number; items: { ingredientId: string; usedQuantity: number }[] },
    restaurantId?: number
  ): Promise<{ success: boolean }> {
    const url = restaurantId ? `/inventory/recipes?restaurantId=${restaurantId}` : '/inventory/recipes';
    return apiClient.post(url, data);
  },

  async getLogs(restaurantId?: number): Promise<InventoryLog[]> {
    const url = restaurantId ? `/inventory/logs?restaurantId=${restaurantId}` : '/inventory/logs';
    return apiClient.get(url);
  }
};
