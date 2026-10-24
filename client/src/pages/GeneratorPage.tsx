import React from 'react';
import { PasswordGeneratorCard } from '../components/generator/PasswordGeneratorCard.js';
import { Dices, Shield, Cpu, Lock } from 'lucide-react';

export const GeneratorPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Dices className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Password Generator
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate strong, high-entropy passwords powered by the hardware-backed Web Crypto API
        </p>
      </div>

      <PasswordGeneratorCard initialLength={24} />

      {/* Cryptographic Security Details & Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm space-y-2">
          <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500 w-fit">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-foreground">True Web Crypto Randomness</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unlike pseudo-random <code className="text-primary-500">Math.random()</code>, passwords are generated using <code className="text-primary-500">window.crypto.getRandomValues()</code> utilizing OS-level CSPRNG entropy.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm space-y-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 w-fit">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-foreground">High-Entropy Passwords</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A 20+ character password containing mixed letters, digits, and symbols provides over 120 bits of entropy—resisting brute force for billions of years.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm space-y-2">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-foreground">Ambiguous Characters Filter</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Eliminates easily misread characters such as <code className="font-mono text-emerald-500">0</code> and <code className="font-mono text-emerald-500">O</code>, <code className="font-mono text-emerald-500">1</code> and <code className="font-mono text-emerald-500">l</code> to avoid typing mistakes on physical devices.
          </p>
        </div>
      </div>
    </div>
  );
};
