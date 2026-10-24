import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { useVault } from '../../context/VaultContext.js';
import { Shield, KeyRound, Lock, Info, Eye, EyeOff } from 'lucide-react';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { unlockVault } = useVault();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) {
      setError('Please enter your Master Password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const ok = await unlockVault(masterPassword);
      if (ok) {
        setMasterPassword('');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unlock vault.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unlock Encrypted Vault" maxWidth="md">
      <form onSubmit={handleUnlock} className="space-y-5">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500 dark:text-primary-400">
          <Shield className="w-6 h-6 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold block text-sm mb-0.5">Zero-Knowledge Vault</span>
            Your Master Password decrypts your credentials locally using Web Crypto AES-256-GCM. It is never transmitted or stored on the server.
          </div>
        </div>

        <div className="space-y-2">
          <Input
            label="Master Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your Master Password..."
            value={masterPassword}
            onChange={(e) => {
              setMasterPassword(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
            startAdornment={<KeyRound className="w-4 h-4" />}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
          <span>
            <strong>Note:</strong> Your Master Password is distinct from your account login password. If you lose this password, your vault data cannot be recovered.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Lock className="w-4 h-4" />}
          >
            Unlock Vault
          </Button>
        </div>
      </form>
    </Modal>
  );
};
