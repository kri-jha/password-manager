import { api } from './api.js';
import { ICredential, IEncryptedSecretPayload } from '../types/index.js';

export interface CredentialQueryParams {
  categoryId?: string;
  favorite?: boolean;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'lastUsedAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CredentialListResponse {
  data: ICredential[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const credentialService = {
  async getCredentials(params?: CredentialQueryParams): Promise<CredentialListResponse> {
    const res = await api.get<{ success: boolean; data: ICredential[]; pagination: any }>('/credentials', {
      params
    });
    return {
      data: res.data.data,
      pagination: res.data.pagination
    };
  },

  async getCredentialById(id: string): Promise<ICredential> {
    const res = await api.get<{ success: boolean; data: ICredential }>(`/credentials/${id}`);
    return res.data.data;
  },

  async createCredential(data: {
    title: string;
    website?: string;
    categoryId?: string | null;
    encryptedSecretPayload: IEncryptedSecretPayload;
    encryptionVersion?: number;
    favorite?: boolean;
  }): Promise<ICredential> {
    const res = await api.post<{ success: boolean; data: ICredential }>('/credentials', data);
    return res.data.data;
  },

  async updateCredential(
    id: string,
    data: {
      title?: string;
      website?: string;
      categoryId?: string | null;
      encryptedSecretPayload?: IEncryptedSecretPayload;
      encryptionVersion?: number;
      favorite?: boolean;
    }
  ): Promise<ICredential> {
    const res = await api.patch<{ success: boolean; data: ICredential }>(`/credentials/${id}`, data);
    return res.data.data;
  },

  async deleteCredential(id: string): Promise<{ deletedId: string }> {
    const res = await api.delete<{ success: boolean; data: { deletedId: string } }>(`/credentials/${id}`);
    return res.data.data;
  },

  async toggleFavorite(id: string): Promise<ICredential> {
    const res = await api.post<{ success: boolean; data: ICredential }>(`/credentials/${id}/favorite`);
    return res.data.data;
  }
};
