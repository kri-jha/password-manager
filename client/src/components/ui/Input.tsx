import React, { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, startAdornment, endAdornment, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-foreground/80 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startAdornment && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground">
              {startAdornment}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full h-10 px-3.5 rounded-xl border bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/80',
                'disabled:cursor-not-allowed disabled:opacity-50',
                startAdornment && 'pl-10',
                endAdornment && 'pr-10',
                error ? 'border-rose-500 focus:ring-rose-500/40' : 'border-border',
                className
              )
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-3 flex items-center">
              {endAdornment}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
