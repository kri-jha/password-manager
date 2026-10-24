import React, { useMemo } from 'react';
import { useVault } from '../context/VaultContext.js';
import { Button } from '../components/ui/Button.js';
import { IDecryptedCredential } from '../types/index.js';
import {
  ShieldAlert,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  CopyCheck,
  Shield
} from 'lucide-react';

interface SecurityPageProps {
  credentials: IDecryptedCredential[];
  onOpenUnlockModal: () => void;
  onSelectCredential: (credential: IDecryptedCredential) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({
  credentials,
  onOpenUnlockModal,
  onSelectCredential
}) => {
  const { isVaultUnlocked } = useVault();

  // Security audit calculations (performed locally over decrypted credentials)
  const audit = useMemo(() => {
    if (!isVaultUnlocked) {
      return {
        weak: [],
        reused: [],
        missing2FA: [],
        score: 0
      };
    }

    const weak: IDecryptedCredential[] = [];
    const passwordMap = new Map<string, IDecryptedCredential[]>();
    const missing2FA: IDecryptedCredential[] = [];

    credentials.forEach((c) => {
      const pass = c.decryptedData?.password || '';

      // Check weak (< 12 chars or low complexity)
      if (
        pass.length < 12 ||
        !/[A-Z]/.test(pass) ||
        !/[a-z]/.test(pass) ||
        !/[0-9]/.test(pass)
      ) {
        weak.push(c);
      }

      // Track password reuse
      if (pass) {
        const existing = passwordMap.get(pass) || [];
        existing.push(c);
        passwordMap.set(pass, existing);
      }

      // Check 2FA notes
      if (!c.decryptedData?.twoFactorNotes && (!c.decryptedData?.recoveryCodes || c.decryptedData.recoveryCodes.length === 0)) {
        missing2FA.push(c);
      }
    });

    const reused: { password: string; items: IDecryptedCredential[] }[] = [];
    passwordMap.forEach((items, password) => {
      if (items.length > 1) {
        reused.push({ password, items });
      }
    });

    // Score calculation
    let calculatedScore = 100;
    if (credentials.length > 0) {
      calculatedScore -= (weak.length / credentials.length) * 40;
      calculatedScore -= (reused.length / credentials.length) * 40;
    }
    calculatedScore = Math.max(10, Math.round(calculatedScore));

    return { weak, reused, missing2FA, score: credentials.length ? calculatedScore : 100 };
  }, [credentials, isVaultUnlocked]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Security Health & Vault Audit
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Zero-knowledge client-side audit for weak, duplicate, and vulnerable passwords
        </p>
      </div>

      {!isVaultUnlocked ? (
        <div className="p-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Vault is Locked</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              To preserve your zero-knowledge privacy, security auditing happens strictly on decrypted items in your browser&apos;s memory. Plaintext passwords are never sent to the backend.
            </p>
          </div>
          <Button variant="primary" onClick={onOpenUnlockModal} leftIcon={<Unlock className="w-4 h-4" />}>
            Unlock Vault to Run Security Audit
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Security Score Overview */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card text-card-foreground shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Overall Vault Health
              </span>
              <h3 className="text-2xl font-extrabold text-foreground">
                {audit.score >= 80 ? 'Excellent Protection' : audit.score >= 50 ? 'Moderate Health' : 'Action Required'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md">
                Based on password length, uniqueness, and two-factor backup coverage across {credentials.length} saved credentials.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="relative w-24 h-24 rounded-full border-4 border-secondary flex items-center justify-center">
                <span
                  className={`text-3xl font-black ${
                    audit.score >= 80
                      ? 'text-emerald-500'
                      : audit.score >= 50
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }`}
                >
                  {audit.score}%
                </span>
              </div>
            </div>
          </div>

          {/* Audit Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weak Passwords */}
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Weak Passwords</span>
                <AlertTriangle className={`w-4 h-4 ${audit.weak.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
              </div>
              <div className={`text-2xl font-extrabold ${audit.weak.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {audit.weak.length}
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Length &lt; 12 chars or low complexity
              </span>
            </div>

            {/* Reused Passwords */}
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Reused Passwords</span>
                <CopyCheck className={`w-4 h-4 ${audit.reused.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
              </div>
              <div className={`text-2xl font-extrabold ${audit.reused.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {audit.reused.length}
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Shared across multiple services
              </span>
            </div>

            {/* Missing 2FA */}
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Without 2FA Notes</span>
                <Shield className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-extrabold text-foreground">{audit.missing2FA.length}</div>
              <span className="text-[11px] text-muted-foreground block">
                Accounts without backup seeds
              </span>
            </div>
          </div>

          {/* Weak Passwords List */}
          {audit.weak.length > 0 && (
            <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-4">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Weak Passwords Detected ({audit.weak.length})</span>
              </div>
              <p className="text-xs text-muted-foreground">
                These credentials have passwords with fewer than 12 characters or lack uppercase/numbers/symbols. Update them with the built-in generator.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {audit.weak.map((cred) => (
                  <div
                    key={cred._id}
                    onClick={() => onSelectCredential(cred)}
                    className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between cursor-pointer hover:border-primary-500 transition-colors"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-foreground">{cred.title}</h5>
                      <span className="text-[11px] text-muted-foreground">
                        {cred.decryptedData?.username || 'No username'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-500 px-2 py-0.5 rounded-full bg-rose-500/10">
                      Weak
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reused Passwords List */}
          {audit.reused.length > 0 && (
            <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <CopyCheck className="w-4 h-4" />
                <span>Reused Passwords Detected ({audit.reused.length} groups)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                If a hacker breaches one service with a reused password, they can access all other accounts using that same password.
              </p>

              <div className="space-y-3">
                {audit.reused.map((group, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Identical password used across {group.items.length} services:
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {group.items.map((cred) => (
                        <button
                          key={cred._id}
                          onClick={() => onSelectCredential(cred)}
                          className="px-3 py-1.5 rounded-lg border border-border/80 bg-secondary/30 text-xs font-medium text-foreground hover:border-primary-500 transition-colors"
                        >
                          {cred.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {audit.weak.length === 0 && audit.reused.length === 0 && (
            <div className="p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-base text-foreground">All Saved Passwords Meet High Security Standards!</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No weak or duplicated credentials were found in your vault.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
