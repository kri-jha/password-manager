import { api } from './api.js';
import { ICategory } from '../types/index.js';

export const categoryService = {
  async getCategories(): Promise<ICategory[]> {
    const res = await api.get<{ success: boolean; data: ICategory[] }>('/categories');
    return res.data.data;
  },

  async createCategory(data: { name: string; icon?: string; color?: string }): Promise<ICategory> {
    const res = await api.post<{ success: boolean; data: ICategory }>('/categories', data);
    return res.data.data;
  },

  async updateCategory(
    id: string,
    data: { name?: string; icon?: string; color?: string }
  ): Promise<ICategory> {
    const res = await api.patch<{ success: boolean; data: ICategory }>(`/categories/${id}`, data);
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<{ deletedId: string; affectedCredentials: number }> {
    const res = await api.delete<{ success: boolean; data: { deletedId: string; affectedCredentials: number } }>(
      `/categories/${id}`
    );
    return res.data.data;
  }
};
