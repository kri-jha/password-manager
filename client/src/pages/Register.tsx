import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useVault } from '../context/VaultContext.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import {
  deriveVaultKey,
  generateRandomSalt,
  createVaultVerifier,
  calculatePasswordStrength
} from '../crypto/vaultCrypto.js';
import { ShieldCheck, Mail, Lock, KeyRound, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '../components/layout/ThemeToggle.js';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');

  const [showAccountPass, setShowAccountPass] = useState(false);
  const [showMasterPass, setShowMasterPass] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register: authRegister } = useAuth();
  const { unlockVault } = useVault();
  const navigate = useNavigate();

  const masterStrength = calculatePasswordStrength(masterPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !accountPassword || !masterPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (accountPassword.length < 8) {
      setError('Account login password must be at least 8 characters long.');
      return;
    }

    if (masterPassword.length < 8) {
      setError('Master Password must be at least 8 characters long.');
      return;
    }

    if (masterPassword !== confirmMasterPassword) {
      setError('Master Passwords do not match.');
      return;
    }

    if (accountPassword === masterPassword) {
      setError('For maximum security, your Master Password must be different from your Account Login password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate client-side salt for master key derivation
      const vaultSalt = generateRandomSalt(16);

      // 2. Derive vault key client-side using Web Crypto PBKDF2 (SHA-256)
      const derivedKey = await deriveVaultKey(masterPassword, vaultSalt);

      // 3. Create verifier challenge
      const vaultAuthVerifier = await createVaultVerifier(derivedKey);

      // 4. Register account on backend (master password is NEVER sent!)
      await authRegister(email, accountPassword, vaultSalt, vaultAuthVerifier);

      // 5. Automatically unlock vault in memory for the fresh account
      await unlockVault(masterPassword);

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden py-12">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg bg-card/90 border border-border rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-primary-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Create Secure Vault</h2>
          <p className="text-xs text-muted-foreground">
            End-to-End Encrypted Personal Password Manager
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startAdornment={<Mail className="w-4 h-4" />}
            required
            autoFocus
          />

          <Input
            label="Account Login Password *"
            type={showAccountPass ? 'text' : 'password'}
            placeholder="Min 8 characters (uppercase, lowercase, number)"
            value={accountPassword}
            onChange={(e) => setAccountPassword(e.target.value)}
            startAdornment={<Lock className="w-4 h-4" />}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowAccountPass(!showAccountPass)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showAccountPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            helperText="Used to authenticate with the server."
            required
          />

          {/* Master Password Section */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-500 uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>Zero-Knowledge Master Password</span>
            </div>

            <Input
              label="Master Password (Vault Key) *"
              type={showMasterPass ? 'text' : 'password'}
              placeholder="Create a strong, memorable master passphrase..."
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              startAdornment={<KeyRound className="w-4 h-4" />}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowMasterPass(!showMasterPass)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showMasterPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            {masterPassword && (
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        step <= masterStrength.score ? masterStrength.color : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {masterStrength.label}
                </span>
              </div>
            )}

            <Input
              label="Confirm Master Password *"
              type={showMasterPass ? 'text' : 'password'}
              placeholder="Re-enter your master password..."
              value={confirmMasterPassword}
              onChange={(e) => setConfirmMasterPassword(e.target.value)}
              startAdornment={<KeyRound className="w-4 h-4" />}
              required
            />

            {/* Zero-knowledge Warning */}
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-semibold">Zero-Knowledge Guarantee:</strong>
                <span>
                  Your Master Password derives your 256-bit encryption key inside your browser. It is never sent to the backend. If forgotten, your vault cannot be recovered.
                </span>
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Create Encrypted Vault
          </Button>
        </form>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-500 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
