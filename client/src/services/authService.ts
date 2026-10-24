import { api, setAuthToken } from './api.js';
import { IUser, IVaultAuthVerifier } from '../types/index.js';

export interface AuthResponse {
  user: IUser;
  token: string;
}

export const authService = {
  async register(
    email: string,
    password: string,
    vaultSalt: string,
    vaultAuthVerifier?: IVaultAuthVerifier
  ): Promise<AuthResponse> {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', {
      email,
      password,
      vaultSalt,
      vaultAuthVerifier
    });
    setAuthToken(res.data.data.token);
    return res.data.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
      email,
      password
    });
    setAuthToken(res.data.data.token);
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      setAuthToken(null);
    }
  },

  async getMe(): Promise<IUser> {
    const res = await api.get<{ success: boolean; data: IUser }>('/auth/me');
    return res.data.data;
  },

  async updateVaultVerifier(vaultSalt: string, vaultAuthVerifier: IVaultAuthVerifier): Promise<void> {
    await api.patch('/auth/vault-verifier', {
      vaultSalt,
      vaultAuthVerifier
    });
  },

  async updateSettings(settings: {
    inactivityTimeoutMinutes?: number;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ inactivityTimeoutMinutes: number }> {
    const res = await api.patch<{ success: boolean; data: { inactivityTimeoutMinutes: number } }>('/auth/settings', settings);
    return res.data.data;
  }
};
