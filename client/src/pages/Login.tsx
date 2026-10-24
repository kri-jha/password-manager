import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { ShieldCheck, Mail, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '../components/layout/ThemeToggle.js';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and account password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-card/90 border border-border rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-primary-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome Back</h2>
          <p className="text-xs text-muted-foreground">
            Sign in to access your Zero-Knowledge encrypted vault
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startAdornment={<Mail className="w-4 h-4" />}
            required
            autoFocus
          />

          <Input
            label="Account Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startAdornment={<Lock className="w-4 h-4" />}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          {/* Master Password Reminder */}
          <div className="p-3 rounded-xl border border-primary-500/20 bg-primary-500/5 flex items-start gap-2.5 text-[11px] text-muted-foreground">
            <KeyRound className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
            <span>
              Your account password authenticates your session. Your <strong>Master Password</strong> will be prompted separately to decrypt your vault items locally.
            </span>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Sign In to Vault
          </Button>
        </form>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          Don&apos;t have an account yet?{' '}
          <Link to="/register" className="font-semibold text-primary-500 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
