import { useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext.js';

export function useClipboard(clearAfterMs: number = 30000) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { success } = useToast();

  const copy = useCallback(
    async (text: string, label: string = 'Text') => {
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        success(`${label} copied to clipboard!`);

        // Automatically clear copy state after 2.5s
        setTimeout(() => {
          setCopiedText(null);
        }, 2500);

        // Security best practice: auto-clear clipboard after 30 seconds for passwords
        if (clearAfterMs > 0 && (label.toLowerCase().includes('password') || label.toLowerCase().includes('code'))) {
          setTimeout(async () => {
            try {
              const currentClip = await navigator.clipboard.readText();
              if (currentClip === text) {
                await navigator.clipboard.writeText('');
              }
            } catch {
              // Permission might be denied to read
            }
          }, clearAfterMs);
        }
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedText(text);
        success(`${label} copied to clipboard!`);
      }
    },
    [clearAfterMs, success]
  );

  return { copy, copiedText };
}
