import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { SecretField } from './SecretField.js';
import { useVault } from '../../context/VaultContext.js';
import { IDecryptedCredential } from '../../types/index.js';
import {
  Star,
  Calendar,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';

interface CredentialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: IDecryptedCredential | null;
  onEdit: (credential: IDecryptedCredential) => void;
  onDelete: (credential: IDecryptedCredential) => void;
  onToggleFavorite: (id: string) => void;
  onOpenUnlockModal: () => void;
}

export const CredentialDetailModal: React.FC<CredentialDetailModalProps> = ({
  isOpen,
  onClose,
  credential,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpenUnlockModal
}) => {
  const { isVaultUnlocked } = useVault();
  const [revealRecoveryCodes, setRevealRecoveryCodes] = useState(false);

  if (!credential) return null;

  const category =
    typeof credential.categoryId === 'object' && credential.categoryId !== null
      ? (credential.categoryId as any)
      : null;

  const dec = credential.decryptedData;

  const websiteUrl = credential.website?.startsWith('http')
    ? credential.website
    : credential.website
    ? `https://${credential.website}`
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={credential.title}
      description={credential.website || 'Saved Credential'}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            {category ? (
              <Badge color={category.color}>{category.name}</Badge>
            ) : (
              <Badge variant="secondary">Uncategorized</Badge>
            )}

            <button
              onClick={() => onToggleFavorite(credential._id)}
              className={`p-1.5 rounded-lg border transition-colors ${
                credential.favorite
                  ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground border-border'
              }`}
              title={credential.favorite ? 'Remove Favorite' : 'Mark Favorite'}
            >
              <Star className={`w-4 h-4 ${credential.favorite ? 'fill-amber-500' : ''}`} />
            </button>

            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground border border-border hover:bg-secondary transition-colors"
                title="Open Website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(credential);
              }}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                onClose();
                onDelete(credential);
              }}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Vault Lock Check */}
        {!isVaultUnlocked ? (
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center space-y-3">
            <Lock className="w-8 h-8 mx-auto text-amber-500" />
            <h4 className="font-bold text-sm text-foreground">Vault is Locked</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              This credential is encrypted with zero-knowledge AES-256-GCM. Unlock your vault with your master password to view secrets.
            </p>
            <Button size="sm" variant="primary" onClick={onOpenUnlockModal} leftIcon={<Unlock className="w-4 h-4" />}>
              Unlock Vault
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Username / Email */}
            {dec?.username && (
              <SecretField
                label="Username / Email"
                value={dec.username}
                isSecret={false}
                isMono={false}
                copyLabel="Username"
              />
            )}

            {/* Password */}
            {dec?.password && (
              <SecretField
                label="Password"
                value={dec.password}
                isSecret={true}
                copyLabel="Password"
              />
            )}

            {/* Recovery Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dec?.recoveryEmail && (
                <SecretField
                  label="Recovery Email"
                  value={dec.recoveryEmail}
                  isSecret={false}
                  isMono={false}
                  copyLabel="Recovery Email"
                />
              )}
              {dec?.recoveryPhone && (
                <SecretField
                  label="Recovery Phone"
                  value={dec.recoveryPhone}
                  isSecret={false}
                  isMono={false}
                  copyLabel="Recovery Phone"
                />
              )}
            </div>

            {/* 2FA Notes */}
            {dec?.twoFactorNotes && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">2FA & TOTP Notes</span>
                <div className="p-3 rounded-xl border border-border bg-secondary/20 text-xs font-mono text-foreground select-all break-all whitespace-pre-wrap">
                  {dec.twoFactorNotes}
                </div>
              </div>
            )}

            {/* Recovery Codes with Explicit Reveal */}
            {dec?.recoveryCodes && dec.recoveryCodes.length > 0 && (
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-secondary/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Recovery Codes ({dec.recoveryCodes.length})
                  </span>
                  <button
                    onClick={() => setRevealRecoveryCodes(!revealRecoveryCodes)}
                    className="text-xs text-primary-500 hover:underline font-medium"
                  >
                    {revealRecoveryCodes ? 'Hide Codes' : 'Reveal Codes'}
                  </button>
                </div>

                {revealRecoveryCodes ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {dec.recoveryCodes.map((code, idx) => (
                      <SecretField
                        key={idx}
                        label={`Code ${idx + 1}`}
                        value={code}
                        isSecret={false}
                        copyLabel="Recovery Code"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Recovery codes are hidden by default for security. Click &quot;Reveal Codes&quot; to inspect.
                  </p>
                )}
              </div>
            )}

            {/* Security Notes */}
            {dec?.securityNotes && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Security Notes</span>
                <div className="p-3 rounded-xl border border-border bg-secondary/20 text-xs text-foreground whitespace-pre-wrap">
                  {dec.securityNotes}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {dec?.customFields && dec.customFields.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-xs font-semibold text-foreground">Custom Fields</span>
                <div className="grid grid-cols-1 gap-2">
                  {dec.customFields.map((f) => (
                    <SecretField
                      key={f.id}
                      label={f.label}
                      value={f.value}
                      isSecret={f.isSecret}
                      copyLabel={f.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Created: {new Date(credential.createdAt).toLocaleDateString()}
          </span>
          <span>Updated: {new Date(credential.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Modal>
  );
};
