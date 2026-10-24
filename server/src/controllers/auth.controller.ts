import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'auth_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, vaultSalt, vaultAuthVerifier } = req.body;
      const result = await authService.register(email, password, vaultSalt, vaultAuthVerifier);

      res.cookie(COOKIE_NAME, result.token, cookieOptions);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.cookie(COOKIE_NAME, result.token, cookieOptions);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getMe(userId);

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          vaultSalt: user.vaultSalt,
          vaultAuthVerifier: user.vaultAuthVerifier,
          inactivityTimeoutMinutes: user.inactivityTimeoutMinutes,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVaultVerifier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { vaultSalt, vaultAuthVerifier } = req.body;
      const user = await authService.updateVaultVerifier(userId, vaultSalt, vaultAuthVerifier);

      res.status(200).json({
        success: true,
        message: 'Vault master credentials verifier updated.',
        data: {
          vaultSalt: user.vaultSalt,
          vaultAuthVerifier: user.vaultAuthVerifier
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.updateAccountSettings(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Account settings updated.',
        data: {
          inactivityTimeoutMinutes: user.inactivityTimeoutMinutes
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
