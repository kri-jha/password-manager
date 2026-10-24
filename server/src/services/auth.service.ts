import jwt from 'jsonwebtoken';
import { User, IUser, IVaultAuthVerifier } from '../models/User.js';
import { Category } from '../models/Category.js';
import { hashAccountPassword, verifyAccountPassword } from '../utils/encryption.js';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors.js';
import { env } from '../config/env.js';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    vaultSalt: string;
    vaultAuthVerifier?: IVaultAuthVerifier;
    inactivityTimeoutMinutes: number;
    createdAt: Date;
  };
  token: string;
}

export class AuthService {
  /**
   * Register a new user with Argon2id-hashed account password and master password salt/verifier.
   * Also seeds default categories (e.g. Logins, Finance, Work, Personal) for instant UX delight.
   */
  async register(
    email: string,
    password: string,
    vaultSalt: string,
    vaultAuthVerifier?: IVaultAuthVerifier
  ): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ConflictError('An account with this email address already exists.');
    }

    // Hash account password using Argon2id
    const accountPasswordHash = await hashAccountPassword(password);

    const user = await User.create({
      email: normalizedEmail,
      accountPasswordHash,
      vaultSalt,
      vaultAuthVerifier,
      inactivityTimeoutMinutes: 15,
      lastLoginAt: new Date()
    });

    // Seed useful default categories
    try {
      await Category.insertMany([
        { userId: user._id, name: 'Websites & Apps', icon: 'globe', color: '#3b82f6' },
        { userId: user._id, name: 'Work & Professional', icon: 'briefcase', color: '#10b981' },
        { userId: user._id, name: 'Finance & Banking', icon: 'credit-card', color: '#f59e0b' },
        { userId: user._id, name: 'Cloud & Servers', icon: 'server', color: '#8b5cf6' }
      ]);
    } catch {
      // Non-fatal if default category seed fails
    }

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        vaultSalt: user.vaultSalt,
        vaultAuthVerifier: user.vaultAuthVerifier,
        inactivityTimeoutMinutes: user.inactivityTimeoutMinutes,
        createdAt: user.createdAt
      },
      token
    };
  }

  /**
   * Log in user with email and account password.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+accountPasswordHash');
    if (!user) {
      // Generic authentication failure message
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isValidPassword = await verifyAccountPassword(user.accountPasswordHash, password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        vaultSalt: user.vaultSalt,
        vaultAuthVerifier: user.vaultAuthVerifier,
        inactivityTimeoutMinutes: user.inactivityTimeoutMinutes,
        createdAt: user.createdAt
      },
      token
    };
  }

  /**
   * Get current user profile and vault metadata.
   */
  async getMe(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return user;
  }

  /**
   * Update vault master password salt and auth verifier (when user changes master password)
   */
  async updateVaultVerifier(
    userId: string,
    vaultSalt: string,
    vaultAuthVerifier: IVaultAuthVerifier
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    user.vaultSalt = vaultSalt;
    user.vaultAuthVerifier = vaultAuthVerifier;
    await user.save();
    return user;
  }

  /**
   * Update account settings (inactivity timeout, account password)
   */
  async updateAccountSettings(
    userId: string,
    data: {
      inactivityTimeoutMinutes?: number;
      currentPassword?: string;
      newPassword?: string;
    }
  ): Promise<IUser> {
    const user = await User.findById(userId).select('+accountPasswordHash');
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (data.inactivityTimeoutMinutes !== undefined) {
      user.inactivityTimeoutMinutes = data.inactivityTimeoutMinutes;
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new BadRequestError('Current password is required to set a new password.');
      }
      const isMatch = await verifyAccountPassword(user.accountPasswordHash, data.currentPassword);
      if (!isMatch) {
        throw new BadRequestError('Current password does not match.');
      }
      user.accountPasswordHash = await hashAccountPassword(data.newPassword);
    }

    await user.save();
    return user;
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      env.SESSION_SECRET,
      { expiresIn: '7d' }
    );
  }
}

export const authService = new AuthService();
