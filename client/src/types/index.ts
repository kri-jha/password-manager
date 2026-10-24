export interface IUser {
  id: string;
  email: string;
  vaultSalt: string;
  vaultAuthVerifier?: IVaultAuthVerifier;
  inactivityTimeoutMinutes: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface IVaultAuthVerifier {
  ciphertext: string;
  iv: string;
  authTag: string;
  version: number;
}

export interface ICategory {
  _id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEncryptedSecretPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  salt?: string;
  version: number;
}

export interface ICustomField {
  id: string;
  label: string;
  value: string;
  isSecret?: boolean;
}

export interface IDecryptedSecretData {
  username?: string;
  password?: string;
  recoveryEmail?: string;
  recoveryPhone?: string;
  twoFactorNotes?: string;
  recoveryCodes?: string[];
  securityNotes?: string;
  customFields?: ICustomField[];
}

export interface ICredential {
  _id: string;
  userId: string;
  categoryId?: ICategory | string | null;
  title: string;
  website?: string;
  encryptedSecretPayload: IEncryptedSecretPayload;
  encryptionVersion: number;
  favorite: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDecryptedCredential extends ICredential {
  decryptedData?: IDecryptedSecretData;
  decryptionError?: boolean;
}

export interface PasswordGeneratorOptions {
  length: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}
