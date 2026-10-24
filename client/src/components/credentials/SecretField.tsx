import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard.js';

interface SecretFieldProps {
  label: string;
  value: string;
  isSecret?: boolean;
  isMono?: boolean;
  copyLabel?: string;
  className?: string;
}

export const SecretField: React.FC<SecretFieldProps> = ({
  label,
  value,
  isSecret = true,
  isMono = true,
  copyLabel = 'Value',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { copy, copiedText } = useClipboard();

  const isCopied = copiedText === value;

  if (!value) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
        <span>{label}</span>
      </div>

      <div className="flex items-center gap-1.5 p-1.5 pl-3 rounded-xl border border-border/70 bg-secondary/25 hover:border-border transition-colors">
        <span
          className={`flex-1 text-sm truncate select-all ${
            isMono ? 'font-mono' : ''
          } ${!isVisible && isSecret ? 'tracking-widest text-muted-foreground' : 'text-foreground'}`}
        >
          {isSecret && !isVisible ? '••••••••••••••••' : value}
        </span>

        {isSecret && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={isVisible ? 'Hide value' : 'Show value'}
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        <button
          type="button"
          onClick={() => copy(value, copyLabel)}
          className={`p-1.5 rounded-lg transition-colors ${
            isCopied
              ? 'text-emerald-500 bg-emerald-500/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title={`Copy ${copyLabel}`}
        >
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
