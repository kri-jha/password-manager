import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Copy, Check, ShieldCheck, Sliders } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { useClipboard } from '../../hooks/useClipboard.js';
import { generateSecurePassword, calculatePasswordStrength } from '../../crypto/vaultCrypto.js';
import { PasswordGeneratorOptions } from '../../types/index.js';

export const PasswordGeneratorCard: React.FC<{ initialLength?: number }> = ({ initialLength = 20 }) => {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: initialLength,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: true
  });

  const [password, setPassword] = useState('');
  const { copy, copiedText } = useClipboard();

  const handleGenerate = useCallback(() => {
    const generated = generateSecurePassword(options);
    setPassword(generated);
  }, [options]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const strength = calculatePasswordStrength(password);
  const isCopied = copiedText === password;

  return (
    <div className="p-6 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Password Generator</h3>
            <p className="text-xs text-muted-foreground">
              Cryptographically secure using Web Crypto API
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Crypto Secure</span>
        </div>
      </div>

      {/* Generated Password Display Bar */}
      <div className="space-y-2">
        <div className="relative flex items-center p-3 rounded-xl border border-border bg-secondary/30">
          <span className="flex-1 font-mono text-base md:text-lg font-semibold text-foreground tracking-wider break-all select-all">
            {password}
          </span>
          <div className="flex items-center gap-1.5 pl-2">
            <button
              onClick={handleGenerate}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:rotate-180"
              title="Generate New Password"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Button
              size="sm"
              variant={isCopied ? 'secondary' : 'primary'}
              onClick={() => copy(password, 'Password')}
              leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            >
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Strength Bar */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden flex gap-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 rounded-full transition-all duration-300 ${
                  step <= strength.score ? strength.color : 'bg-transparent'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-muted-foreground">{strength.label}</span>
        </div>
      </div>

      {/* Controls & Options */}
      <div className="space-y-4 pt-2 border-t border-border/60">
        {/* Length Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>Password Length</span>
            <span className="px-2 py-0.5 rounded-lg bg-secondary font-mono text-primary-500">
              {options.length} characters
            </span>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value, 10) })}
            className="w-full accent-primary-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>8</span>
            <span>20</span>
            <span>32</span>
            <span>48</span>
            <span>64</span>
          </div>
        </div>

        {/* Character Set Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-secondary/15 hover:bg-secondary/30 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={options.useUppercase}
              onChange={(e) => setOptions({ ...options, useUppercase: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs font-medium text-foreground">Uppercase Letters (A-Z)</span>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-secondary/15 hover:bg-secondary/30 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={options.useLowercase}
              onChange={(e) => setOptions({ ...options, useLowercase: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs font-medium text-foreground">Lowercase Letters (a-z)</span>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-secondary/15 hover:bg-secondary/30 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={options.useNumbers}
              onChange={(e) => setOptions({ ...options, useNumbers: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs font-medium text-foreground">Numbers (0-9)</span>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-secondary/15 hover:bg-secondary/30 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={options.useSymbols}
              onChange={(e) => setOptions({ ...options, useSymbols: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs font-medium text-foreground">Symbols (!@#$%^&*)</span>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-secondary/15 hover:bg-secondary/30 cursor-pointer select-none transition-colors sm:col-span-2">
            <input
              type="checkbox"
              checked={options.excludeAmbiguous}
              onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs font-medium text-foreground">
              Exclude Ambiguous Characters (e.g. {`{ } [ ] ( ) / \\ ' " ~ , ; : . < > | I l 1 O 0`})
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
