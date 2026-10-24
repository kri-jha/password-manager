import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useVault } from '../context/VaultContext.js';
import { useToast } from '../context/ToastContext.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { IDecryptedCredential } from '../types/index.js';
import {
  Settings,
  Clock,
  KeyRound,
  Lock,
  Shield,
  LogOut,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';

interface SettingsPageProps {
  credentials: IDecryptedCredential[];
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ credentials }) => {
  const { user, updateSettings, logout } = useAuth();
  const { changeMasterPassword } = useVault();
  const { success: toastSuccess, error: toastError } = useToast();

  // Inactivity timeout state
  const [timeoutMinutes, setTimeoutMinutes] = useState(user?.inactivityTimeoutMinutes || 15);
  const [isSavingTimeout, setIsSavingTimeout] = useState(false);

  // Change Master Password state
  const [currentMasterPass, setCurrentMasterPass] = useState('');
  const [newMasterPass, setNewMasterPass] = useState('');
  const [confirmMasterPass, setConfirmMasterPass] = useState('');
  const [isChangingMaster, setIsChangingMaster] = useState(false);

  // Change Account Password state
  const [currentAccountPass, setCurrentAccountPass] = useState('');
  const [newAccountPass, setNewAccountPass] = useState('');
  const [isChangingAccount, setIsChangingAccount] = useState(false);

  // Save inactivity timeout
  const handleSaveTimeout = async () => {
    setIsSavingTimeout(true);
    try {
      await updateSettings({ inactivityTimeoutMinutes: Number(timeoutMinutes) });
      toastSuccess('Inactivity timeout updated!');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update timeout.');
    } finally {
      setIsSavingTimeout(false);
    }
  };

  // Change Master Password (re-encrypting all credentials on client)
  const handleChangeMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMasterPass || !newMasterPass) {
      toastError('Please fill in both current and new Master Passwords.');
      return;
    }
    if (newMasterPass.length < 8) {
      toastError('New Master Password must be at least 8 characters long.');
      return;
    }
    if (newMasterPass !== confirmMasterPass) {
      toastError('Confirm Master Password does not match.');
      return;
    }

    setIsChangingMaster(true);
    try {
      await changeMasterPassword(currentMasterPass, newMasterPass, credentials);
      setCurrentMasterPass('');
      setNewMasterPass('');
      setConfirmMasterPass('');
    } catch (err: any) {
      toastError(err.message || 'Failed to change Master Password.');
    } finally {
      setIsChangingMaster(false);
    }
  };

  // Change Account Login Password
  const handleChangeAccountPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccountPass || !newAccountPass) {
      toastError('Please enter current and new account passwords.');
      return;
    }
    if (newAccountPass.length < 8) {
      toastError('New account password must be at least 8 characters.');
      return;
    }

    setIsChangingAccount(true);
    try {
      await updateSettings({
        currentPassword: currentAccountPass,
        newPassword: newAccountPass
      });
      setCurrentAccountPass('');
      setNewAccountPass('');
      toastSuccess('Account login password updated successfully!');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to change account password.');
    } finally {
      setIsChangingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Settings & Vault</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure security policies, timeouts, and manage cryptographic keys
        </p>
      </div>

      {/* Inactivity Auto-Lock Timeout */}
      <div className="p-6 rounded-3xl border border-border/80 bg-card text-card-foreground shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Inactivity Auto-Lock Timeout</h3>
            <p className="text-xs text-muted-foreground">
              Automatically wipe decrypted keys from memory after inactivity
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
          <select
            value={timeoutMinutes}
            onChange={(e) => setTimeoutMinutes(parseInt(e.target.value, 10))}
            className="w-full sm:w-64 h-10 px-3 rounded-xl border border-border bg-secondary/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="5">5 Minutes</option>
            <option value="15">15 Minutes (Default)</option>
            <option value="30">30 Minutes</option>
            <option value="60">1 Hour</option>
            <option value="0">Never (Not Recommended)</option>
          </select>

          <Button
            size="md"
            variant="primary"
            onClick={handleSaveTimeout}
            isLoading={isSavingTimeout}
          >
            Save Timeout
          </Button>
        </div>
      </div>

      {/* Change Master Password (Re-encryption) */}
      <div className="p-6 rounded-3xl border border-border/80 bg-card text-card-foreground shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Change Master Password</h3>
            <p className="text-xs text-muted-foreground">
              Re-encrypts all stored credentials with a new client-derived AES-256-GCM key
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-primary-500/20 bg-primary-500/5 text-xs text-muted-foreground flex items-start gap-2.5">
          <Info className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
          <span>
            When you change your Master Password, your browser decrypts all saved items with the old key, generates a fresh cryptographic salt, and re-encrypts all {credentials.length} items with the new key before uploading.
          </span>
        </div>

        <form onSubmit={handleChangeMasterPassword} className="space-y-4 pt-2">
          <Input
            label="Current Master Password *"
            type="password"
            placeholder="••••••••••••"
            value={currentMasterPass}
            onChange={(e) => setCurrentMasterPass(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Master Password *"
              type="password"
              placeholder="Min 8 characters..."
              value={newMasterPass}
              onChange={(e) => setNewMasterPass(e.target.value)}
              required
            />
            <Input
              label="Confirm New Master Password *"
              type="password"
              placeholder="Confirm new password..."
              value={confirmMasterPass}
              onChange={(e) => setConfirmMasterPass(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="primary" isLoading={isChangingMaster}>
            Re-Encrypt Vault with New Key
          </Button>
        </form>
      </div>

      {/* Change Account Login Password */}
      <div className="p-6 rounded-3xl border border-border/80 bg-card text-card-foreground shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Change Account Login Password</h3>
            <p className="text-xs text-muted-foreground">
              Updates your server authentication credentials (hashed with Argon2id)
            </p>
          </div>
        </div>

        <form onSubmit={handleChangeAccountPassword} className="space-y-4 pt-2">
          <Input
            label="Current Account Password *"
            type="password"
            placeholder="••••••••••••"
            value={currentAccountPass}
            onChange={(e) => setCurrentAccountPass(e.target.value)}
            required
          />

          <Input
            label="New Account Password *"
            type="password"
            placeholder="Min 8 characters (uppercase, lowercase, number)..."
            value={newAccountPass}
            onChange={(e) => setNewAccountPass(e.target.value)}
            required
          />

          <Button type="submit" variant="secondary" isLoading={isChangingAccount}>
            Update Account Password
          </Button>
        </form>
      </div>

      {/* Security Guidance & Architecture Explainer */}
      <div className="p-6 rounded-3xl border border-border/80 bg-secondary/15 space-y-4">
        <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
          <Shield className="w-5 h-5 text-primary-500" />
          <span>Zero-Knowledge Security Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground leading-relaxed">
          <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
            <strong className="text-foreground block flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Account Password vs Master Password
            </strong>
            <p>
              Your <strong>Account Password</strong> is verified on the server via Argon2id to establish session cookies. Your <strong>Master Password</strong> never leaves your browser and is used exclusively by Web Crypto AES-256-GCM to decrypt your credentials.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-card border border-border/60">
            <strong className="text-foreground block flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> No Server Decryption Possible
            </strong>
            <p>
              Even if the database or server is compromised, attackers only obtain high-entropy ciphertexts and nonces. Decryption is mathematically impossible without your client-held Master Password.
            </p>
          </div>
        </div>
      </div>

      {/* Sign Out Action */}
      <div className="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-foreground">Sign Out of Vault</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ends your current session and purges in-memory keys
          </p>
        </div>
        <Button variant="destructive" onClick={logout} leftIcon={<LogOut className="w-4 h-4" />}>
          Log Out
        </Button>
      </div>
    </div>
  );
};
