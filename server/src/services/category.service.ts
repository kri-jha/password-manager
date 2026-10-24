import { Types } from 'mongoose';
import { Category, ICategory } from '../models/Category.js';
import { Credential } from '../models/Credential.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export class CategoryService {
  /**
   * List all categories for the authenticated user, sorted alphabetically.
   */
  async getCategories(userId: string): Promise<ICategory[]> {
    return Category.find({ userId: new Types.ObjectId(userId) }).sort({ name: 1 });
  }

  /**
   * Create a new category for the authenticated user.
   */
  async createCategory(
    userId: string,
    data: { name: string; icon?: string; color?: string }
  ): Promise<ICategory> {
    const userObjectId = new Types.ObjectId(userId);

    const existing = await Category.findOne({
      userId: userObjectId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
    });

    if (existing) {
      throw new ConflictError('A category with this name already exists.');
    }

    return Category.create({
      userId: userObjectId,
      name: data.name.trim(),
      icon: data.icon || 'folder',
      color: data.color || '#6366f1'
    });
  }

  /**
   * Update category by ID, strictly enforcing user ownership.
   */
  async updateCategory(
    userId: string,
    categoryId: string,
    data: { name?: string; icon?: string; color?: string }
  ): Promise<ICategory> {
    const category = await Category.findOne({
      _id: new Types.ObjectId(categoryId),
      userId: new Types.ObjectId(userId)
    });

    if (!category) {
      throw new NotFoundError('Category not found.');
    }

    if (data.name && data.name.trim() !== category.name) {
      const existing = await Category.findOne({
        userId: new Types.ObjectId(userId),
        _id: { $ne: category._id },
        name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
      });
      if (existing) {
        throw new ConflictError('Another category already uses this name.');
      }
      category.name = data.name.trim();
    }

    if (data.icon !== undefined) category.icon = data.icon;
    if (data.color !== undefined) category.color = data.color;

    await category.save();
    return category;
  }

  /**
   * Delete category safely:
   * Policy: Any credentials belonging to this category are moved to Uncategorized (categoryId = null),
   * preventing orphaned references or accidental data loss.
   */
  async deleteCategory(userId: string, categoryId: string): Promise<{ deletedId: string; affectedCredentials: number }> {
    const categoryObjectId = new Types.ObjectId(categoryId);
    const userObjectId = new Types.ObjectId(userId);

    const category = await Category.findOne({
      _id: categoryObjectId,
      userId: userObjectId
    });

    if (!category) {
      throw new NotFoundError('Category not found.');
    }

    // Reassign all associated credentials to null (Uncategorized)
    const updateResult = await Credential.updateMany(
      { userId: userObjectId, categoryId: categoryObjectId },
      { $set: { categoryId: null } }
    );

    // Delete the category
    await Category.deleteOne({ _id: categoryObjectId, userId: userObjectId });

    return {
      deletedId: categoryId,
      affectedCredentials: updateResult.modifiedCount
    };
  }
}

export const categoryService = new CategoryService();
