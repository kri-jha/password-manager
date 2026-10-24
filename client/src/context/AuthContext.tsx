import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IUser } from '../types/index.js';
import { authService, AuthResponse } from '../services/authService.js';
import { useToast } from './ToastContext.js';

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    email: string,
    password: string,
    vaultSalt: string,
    vaultAuthVerifier?: any
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateSettings: (settings: {
    inactivityTimeoutMinutes?: number;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { error: toastError, info: toastInfo } = useToast();

  const refreshProfile = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    // Listen for custom 401 session expiration event from Axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      toastInfo('Your session has expired. Please log in again.');
    };

    window.addEventListener('aegis:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('aegis:session-expired', handleSessionExpired);
    };
  }, [refreshProfile, toastInfo]);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const res = await authService.login(email, password);
      setUser(res.user);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toastError(msg);
      throw err;
    }
  };

  const register = async (
    email: string,
    password: string,
    vaultSalt: string,
    vaultAuthVerifier?: any
  ): Promise<AuthResponse> => {
    try {
      const res = await authService.register(email, password, vaultSalt, vaultAuthVerifier);
      setUser(res.user);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toastError(msg);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Continue client cleanup even if network request fails
    } finally {
      setUser(null);
    }
  };

  const updateSettings = async (settings: {
    inactivityTimeoutMinutes?: number;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<void> => {
    const res = await authService.updateSettings(settings);
    setUser((prev) => (prev ? { ...prev, inactivityTimeoutMinutes: res.inactivityTimeoutMinutes } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateSettings,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
