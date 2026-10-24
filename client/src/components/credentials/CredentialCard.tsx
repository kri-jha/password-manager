import React from 'react';
import { Star, Copy, Globe, KeyRound, Lock, Check } from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { useVault } from '../../context/VaultContext.js';
import { useClipboard } from '../../hooks/useClipboard.js';
import { IDecryptedCredential } from '../../types/index.js';

interface CredentialCardProps {
  credential: IDecryptedCredential;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  credential,
  onClick,
  onToggleFavorite
}) => {
  const { isVaultUnlocked } = useVault();
  const { copy, copiedText } = useClipboard();

  const category =
    typeof credential.categoryId === 'object' && credential.categoryId !== null
      ? (credential.categoryId as any)
      : null;

  const username = credential.decryptedData?.username;
  const password = credential.decryptedData?.password;

  const isUserCopied = username && copiedText === username;
  const isPassCopied = password && copiedText === password;

  // Extract initial for avatar
  const initial = credential.title.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border/80 bg-card hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className="space-y-3">
        {/* Top Card Bar */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600/20 to-indigo-500/20 text-primary-500 dark:text-primary-400 font-bold flex items-center justify-center shrink-0 border border-primary-500/25">
              {initial || <KeyRound className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary-500 transition-colors">
                {credential.title}
              </h4>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                {credential.website ? (
                  <>
                    <Globe className="w-3 h-3 shrink-0" />
                    <span>{credential.website.replace(/^https?:\/\//, '')}</span>
                  </>
                ) : (
                  <span>Application</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => onToggleFavorite(e, credential._id)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              credential.favorite
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-muted-foreground/50 hover:text-amber-500 hover:bg-secondary'
            }`}
            title={credential.favorite ? 'Remove Favorite' : 'Mark Favorite'}
          >
            <Star className={`w-4 h-4 ${credential.favorite ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Username & Masked Password Quick Actions */}
        <div className="pt-2 border-t border-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate max-w-[170px] select-all">
              {username || (isVaultUnlocked ? 'No username' : '••••••••••••')}
            </span>
            {username && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copy(username, 'Username');
                }}
                className={`p-1 rounded text-muted-foreground hover:text-foreground transition-colors ${
                  isUserCopied ? 'text-emerald-500' : ''
                }`}
                title="Copy Username"
              >
                {isUserCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="tracking-widest text-muted-foreground">
              {password && isVaultUnlocked ? '••••••••••••' : '••••••••••••'}
            </span>
            {password && isVaultUnlocked ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copy(password, 'Password');
                }}
                className={`p-1 rounded text-muted-foreground hover:text-foreground transition-colors ${
                  isPassCopied ? 'text-emerald-500' : ''
                }`}
                title="Copy Password"
              >
                {isPassCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="text-[10px] text-amber-500 flex items-center gap-1 font-sans">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Category Tag */}
      <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between">
        {category ? (
          <Badge color={category.color}>{category.name}</Badge>
        ) : (
          <Badge variant="secondary">Uncategorized</Badge>
        )}
        <span className="text-[10px] text-muted-foreground">
          {new Date(credential.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
