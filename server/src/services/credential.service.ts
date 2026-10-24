import { Types } from 'mongoose';
import { Credential, ICredential, IEncryptedSecretPayload } from '../models/Credential.js';
import { Category } from '../models/Category.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export interface CredentialFilterOptions {
  categoryId?: string;
  favorite?: boolean;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'lastUsedAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class CredentialService {
  /**
   * List credentials with optional server-side filtering on non-secret metadata (category, favorite, title/website),
   * plus pagination and sorting.
   */
  async getCredentials(
    userId: string,
    options: CredentialFilterOptions
  ): Promise<PaginatedResult<ICredential>> {
    const userObjectId = new Types.ObjectId(userId);
    const query: any = { userId: userObjectId };

    // Category filter
    if (options.categoryId) {
      if (options.categoryId === 'uncategorized') {
        query.categoryId = null;
      } else {
        query.categoryId = new Types.ObjectId(options.categoryId);
      }
    }

    // Favorite filter
    if (options.favorite !== undefined) {
      query.favorite = options.favorite;
    }

    // Search query on title or website (non-secret metadata only)
    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { website: searchRegex }];
    }

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.order === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      Credential.find(query)
        .populate('categoryId', 'name icon color')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Credential.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get single credential by ID, enforcing user ownership.
   */
  async getCredentialById(userId: string, credentialId: string): Promise<ICredential> {
    const credential = await Credential.findOne({
      _id: new Types.ObjectId(credentialId),
      userId: new Types.ObjectId(userId)
    }).populate('categoryId', 'name icon color');

    if (!credential) {
      throw new NotFoundError('Credential not found.');
    }

    // Update lastUsedAt timestamp when accessed
    credential.lastUsedAt = new Date();
    await credential.save();

    return credential;
  }

  /**
   * Create new credential. Validates category ownership before assignment.
   */
  async createCredential(
    userId: string,
    data: {
      title: string;
      website?: string;
      categoryId?: string | null;
      encryptedSecretPayload: IEncryptedSecretPayload;
      encryptionVersion?: number;
      favorite?: boolean;
    }
  ): Promise<ICredential> {
    const userObjectId = new Types.ObjectId(userId);
    let categoryObjectId: Types.ObjectId | null = null;

    if (data.categoryId) {
      const category = await Category.findOne({
        _id: new Types.ObjectId(data.categoryId),
        userId: userObjectId
      });
      if (!category) {
        throw new BadRequestError('The specified category does not exist or does not belong to you.');
      }
      categoryObjectId = category._id;
    }

    const credential = await Credential.create({
      userId: userObjectId,
      categoryId: categoryObjectId,
      title: data.title.trim(),
      website: data.website ? data.website.trim() : '',
      encryptedSecretPayload: data.encryptedSecretPayload,
      encryptionVersion: data.encryptionVersion || 1,
      favorite: !!data.favorite
    });

    return credential.populate('categoryId', 'name icon color');
  }

  /**
   * Update existing credential. Mass assignment protected.
   */
  async updateCredential(
    userId: string,
    credentialId: string,
    data: {
      title?: string;
      website?: string;
      categoryId?: string | null;
      encryptedSecretPayload?: IEncryptedSecretPayload;
      encryptionVersion?: number;
      favorite?: boolean;
    }
  ): Promise<ICredential> {
    const userObjectId = new Types.ObjectId(userId);
    const credential = await Credential.findOne({
      _id: new Types.ObjectId(credentialId),
      userId: userObjectId
    });

    if (!credential) {
      throw new NotFoundError('Credential not found.');
    }

    if (data.title !== undefined) credential.title = data.title.trim();
    if (data.website !== undefined) credential.website = data.website.trim();
    if (data.favorite !== undefined) credential.favorite = data.favorite;
    if (data.encryptedSecretPayload !== undefined) credential.encryptedSecretPayload = data.encryptedSecretPayload;
    if (data.encryptionVersion !== undefined) credential.encryptionVersion = data.encryptionVersion;

    if (data.categoryId !== undefined) {
      if (data.categoryId === null || data.categoryId === '') {
        credential.categoryId = null;
      } else {
        const category = await Category.findOne({
          _id: new Types.ObjectId(data.categoryId),
          userId: userObjectId
        });
        if (!category) {
          throw new BadRequestError('The specified category does not exist or does not belong to you.');
        }
        credential.categoryId = category._id;
      }
    }

    await credential.save();
    return credential.populate('categoryId', 'name icon color');
  }

  /**
   * Delete credential. Strict ownership enforcement.
   */
  async deleteCredential(userId: string, credentialId: string): Promise<{ deletedId: string }> {
    const result = await Credential.deleteOne({
      _id: new Types.ObjectId(credentialId),
      userId: new Types.ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Credential not found.');
    }

    return { deletedId: credentialId };
  }

  /**
   * Toggle favorite status.
   */
  async toggleFavorite(userId: string, credentialId: string): Promise<ICredential> {
    const credential = await Credential.findOne({
      _id: new Types.ObjectId(credentialId),
      userId: new Types.ObjectId(userId)
    });

    if (!credential) {
      throw new NotFoundError('Credential not found.');
    }

    credential.favorite = !credential.favorite;
    await credential.save();
    return credential.populate('categoryId', 'name icon color');
  }
}

export const credentialService = new CredentialService();
