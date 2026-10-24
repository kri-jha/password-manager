import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service.js';

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const categories = await categoryService.getCategories(userId);

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const category = await categoryService.createCategory(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const categoryId = req.params.id as string;
      const category = await categoryService.updateCategory(userId, categoryId, req.body);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully.',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const categoryId = req.params.id as string;
      const result = await categoryService.deleteCategory(userId, categoryId);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully. Associated credentials moved to Uncategorized.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
