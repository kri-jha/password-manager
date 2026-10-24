import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.js';
import { useToast } from './ToastContext.js';
import {
  deriveVaultKey,
  createVaultVerifier,
  verifyVaultKey,
  encryptCredentialPayload,
  decryptCredentialPayload,
  generateRandomSalt
} from '../crypto/vaultCrypto.js';
import {
  IEncryptedSecretPayload,
  IDecryptedSecretData,
  ICredential,
  IDecryptedCredential
} from '../types/index.js';
import { authService } from '../services/authService.js';
import { credentialService } from '../services/credentialService.js';

interface VaultContextType {
  isVaultUnlocked: boolean;
  vaultKey: CryptoKey | null;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  lockVault: () => void;
  encryptSecret: (data: IDecryptedSecretData) => Promise<IEncryptedSecretPayload>;
  decryptSecret: (payload: IEncryptedSecretPayload) => Promise<IDecryptedSecretData>;
  decryptCredentialItem: (credential: ICredential) => Promise<IDecryptedCredential>;
  changeMasterPassword: (
    currentMasterPassword: string,
    newMasterPassword: string,
    credentials: ICredential[]
  ) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  // In-memory only! Never in localStorage or sessionStorage
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const isVaultUnlocked = !!vaultKey;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockVault = useCallback(() => {
    if (vaultKey) {
      setVaultKey(null);
      toastInfo('Vault locked.');
    }
  }, [vaultKey, toastInfo]);

  // Inactivity timeout handler
  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isVaultUnlocked || !user) return;

    const timeoutMinutes = user.inactivityTimeoutMinutes || 15;
    if (timeoutMinutes <= 0) return; // 0 = never

    timerRef.current = setTimeout(() => {
      setVaultKey(null);
      toastInfo('Vault automatically locked due to inactivity.');
    }, timeoutMinutes * 60 * 1000);
  }, [isVaultUnlocked, user, toastInfo]);

  useEffect(() => {
    if (!isVaultUnlocked) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((ev) => window.addEventListener(ev, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVaultUnlocked, resetInactivityTimer]);

  // Lock vault on user logout
  useEffect(() => {
    if (!isAuthenticated) {
      setVaultKey(null);
    }
  }, [isAuthenticated]);

  const unlockVault = async (masterPassword: string): Promise<boolean> => {
    if (!user || !user.vaultSalt) {
      toastError('Vault salt not found on account.');
      return false;
    }

    try {
      const derivedKey = await deriveVaultKey(masterPassword, user.vaultSalt);

      // If user already has an auth verifier, check against it
      if (user.vaultAuthVerifier) {
        const isValid = await verifyVaultKey(user.vaultAuthVerifier, derivedKey);
        if (!isValid) {
          toastError('Incorrect Master Password. Please try again.');
          return false;
        }
      } else {
        // Initial setup: generate and store verifier challenge
        const verifier = await createVaultVerifier(derivedKey);
        await authService.updateVaultVerifier(user.vaultSalt, verifier);
        await refreshProfile();
      }

      setVaultKey(derivedKey);
      toastSuccess('Vault unlocked successfully.');
      return true;
    } catch (err: any) {
      toastError('Failed to unlock vault: ' + (err.message || 'Unknown error'));
      return false;
    }
  };

  const encryptSecret = async (data: IDecryptedSecretData): Promise<IEncryptedSecretPayload> => {
    if (!vaultKey) {
      throw new Error('Vault is locked. Unlock the vault to encrypt secrets.');
    }
    return encryptCredentialPayload(data, vaultKey);
  };

  const decryptSecret = async (payload: IEncryptedSecretPayload): Promise<IDecryptedSecretData> => {
    if (!vaultKey) {
      throw new Error('Vault is locked. Unlock the vault to decrypt secrets.');
    }
    return decryptCredentialPayload(payload, vaultKey);
  };

  const decryptCredentialItem = async (credential: ICredential): Promise<IDecryptedCredential> => {
    if (!vaultKey) {
      return { ...credential, decryptionError: true };
    }
    try {
      const decryptedData = await decryptSecret(credential.encryptedSecretPayload);
      return { ...credential, decryptedData };
    } catch {
      return { ...credential, decryptionError: true };
    }
  };

  const changeMasterPassword = async (
    currentMasterPassword: string,
    newMasterPassword: string,
    credentials: ICredential[]
  ): Promise<void> => {
    if (!user) throw new Error('Not authenticated.');

    // 1. Verify old master password
    const oldKey = await deriveVaultKey(currentMasterPassword, user.vaultSalt);
    if (user.vaultAuthVerifier) {
      const isValid = await verifyVaultKey(user.vaultAuthVerifier, oldKey);
      if (!isValid) {
        throw new Error('Current Master Password is incorrect.');
      }
    }

    // 2. Generate new random salt and derive new key
    const newSalt = generateRandomSalt(16);
    const newKey = await deriveVaultKey(newMasterPassword, newSalt);

    // 3. Decrypt all credentials with oldKey, re-encrypt with newKey, and update on backend
    for (const cred of credentials) {
      try {
        const decrypted = await decryptCredentialPayload(cred.encryptedSecretPayload, oldKey);
        const reEncrypted = await encryptCredentialPayload(decrypted, newKey);
        await credentialService.updateCredential(cred._id, {
          encryptedSecretPayload: reEncrypted
        });
      } catch (err) {
        console.error(`Failed to re-encrypt credential ${cred._id}:`, err);
      }
    }

    // 4. Create new verifier and update on backend
    const newVerifier = await createVaultVerifier(newKey);
    await authService.updateVaultVerifier(newSalt, newVerifier);

    // 5. Update state
    setVaultKey(newKey);
    await refreshProfile();
    toastSuccess('Master Password changed and all vault items re-encrypted successfully!');
  };

  return (
    <VaultContext.Provider
      value={{
        isVaultUnlocked,
        vaultKey,
        unlockVault,
        lockVault,
        encryptSecret,
        decryptSecret,
        decryptCredentialItem,
        changeMasterPassword
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within a VaultProvider');
  return context;
};
