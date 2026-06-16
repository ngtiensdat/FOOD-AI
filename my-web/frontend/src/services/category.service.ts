import { apiClient } from '@/lib/api-client';

export interface CategoryGroup {
  id: number;
  name: string;
  order: number;
  restaurantId: number;
  categories?: Category[];
}

export interface Category {
  id: number;
  name: string;
  order: number;
  groupId: number;
  parentId: number | null;
  depth: number;
  children?: Category[];
}

export const categoryService = {
  // --- Category Groups ---
  async getCategoryGroups(): Promise<CategoryGroup[]> {
    return apiClient.get('/merchant/category-groups')
      .then((res: unknown) => (res as CategoryGroup[]) || [])
      .catch(() => []);
  },

  async createCategoryGroup(data: { name: string; order?: number }) {
    return apiClient.post('/merchant/category-groups', data);
  },

  async updateCategoryGroup(id: number, data: { name?: string; order?: number }) {
    return apiClient.put(`/merchant/category-groups/${id}`, data);
  },

  async deleteCategoryGroup(id: number) {
    return apiClient.delete(`/merchant/category-groups/${id}`);
  },

  // --- Categories ---
  async getCategoriesByGroup(groupId: number): Promise<Category[]> {
    return apiClient.get('/merchant/categories', { params: { groupId } })
      .then((res: unknown) => (res as Category[]) || [])
      .catch(() => []);
  },

  async createCategory(data: { name: string; order?: number; groupId: number; parentId?: number; depth?: number }) {
    return apiClient.post('/merchant/categories', data);
  },

  async updateCategory(id: number, data: { name?: string; order?: number; parentId?: number; depth?: number }) {
    return apiClient.put(`/merchant/categories/${id}`, data);
  },

  async deleteCategory(id: number) {
    return apiClient.delete(`/merchant/categories/${id}`);
  },

  // --- Public Hierarchy ---
  async getPublicHierarchy(restaurantId: number): Promise<CategoryGroup[]> {
    return apiClient.get(`/public/restaurants/${restaurantId}/categories/hierarchy`)
      .then((res: unknown) => (res as CategoryGroup[]) || [])
      .catch(() => []);
  }
};
