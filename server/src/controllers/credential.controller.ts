import { Request, Response, NextFunction } from 'express';
import { credentialService } from '../services/credential.service.js';

export class CredentialController {
  async getCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { categoryId, favorite, search, sortBy, order, page, limit } = req.query as any;

      const result = await credentialService.getCredentials(userId, {
        categoryId,
        favorite,
        search,
        sortBy,
        order,
        page,
        limit
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getCredentialById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const credentialId = req.params.id as string;
      const credential = await credentialService.getCredentialById(userId, credentialId);

      res.status(200).json({
        success: true,
        data: credential
      });
    } catch (error) {
      next(error);
    }
  }

  async createCredential(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const credential = await credentialService.createCredential(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Credential created successfully.',
        data: credential
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCredential(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const credentialId = req.params.id as string;
      const credential = await credentialService.updateCredential(userId, credentialId, req.body);

      res.status(200).json({
        success: true,
        message: 'Credential updated successfully.',
        data: credential
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCredential(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const credentialId = req.params.id as string;
      const result = await credentialService.deleteCredential(userId, credentialId);

      res.status(200).json({
        success: true,
        message: 'Credential deleted successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const credentialId = req.params.id as string;
      const credential = await credentialService.toggleFavorite(userId, credentialId);

      res.status(200).json({
        success: true,
        message: credential.favorite ? 'Marked as favorite.' : 'Removed from favorites.',
        data: credential
      });
    } catch (error) {
      next(error);
    }
  }
}

export const credentialController = new CredentialController();
