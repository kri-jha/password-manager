import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { useToast } from '../../context/ToastContext.js';
import { categoryService } from '../../services/categoryService.js';
import { ICategory } from '../../types/index.js';
import {
  Folder,
  Globe,
  Briefcase,
  CreditCard,
  Key,
  Shield,
  Server,
  Smartphone,
  Cloud,
  Mail,
  Check
} from 'lucide-react';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCategory?: ICategory | null;
}

const AVAILABLE_ICONS = [
  { name: 'folder', icon: <Folder className="w-4 h-4" /> },
  { name: 'globe', icon: <Globe className="w-4 h-4" /> },
  { name: 'briefcase', icon: <Briefcase className="w-4 h-4" /> },
  { name: 'credit-card', icon: <CreditCard className="w-4 h-4" /> },
  { name: 'key', icon: <Key className="w-4 h-4" /> },
  { name: 'shield', icon: <Shield className="w-4 h-4" /> },
  { name: 'server', icon: <Server className="w-4 h-4" /> },
  { name: 'smartphone', icon: <Smartphone className="w-4 h-4" /> },
  { name: 'cloud', icon: <Cloud className="w-4 h-4" /> },
  { name: 'mail', icon: <Mail className="w-4 h-4" /> }
];

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#a855f7'  // Purple
];

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategory
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [color, setColor] = useState('#6366f1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setIcon(initialCategory.icon || 'folder');
      setColor(initialCategory.color || '#6366f1');
    } else {
      setName('');
      setIcon('folder');
      setColor('#6366f1');
    }
    setError('');
  }, [initialCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (initialCategory) {
        await categoryService.updateCategory(initialCategory._id, {
          name: name.trim(),
          icon,
          color
        });
        toastSuccess('Category updated!');
      } else {
        await categoryService.createCategory({
          name: name.trim(),
          icon,
          color
        });
        toastSuccess('Category created!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
      toastError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCategory ? 'Edit Category' : 'Create Custom Category'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Category Name *"
          placeholder="e.g. Work Accounts, Streaming, Crypto"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
          autoFocus
        />

        {/* Icon Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground/80 tracking-wide">
            Select Icon
          </label>
          <div className="grid grid-cols-5 gap-2">
            {AVAILABLE_ICONS.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setIcon(item.name)}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                  icon === item.name
                    ? 'border-primary-500 bg-primary-500/10 text-primary-500 ring-2 ring-primary-500/30'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                }`}
                title={item.name}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground/80 tracking-wide">
            Badge Accent Color
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm"
              >
                {color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 rounded-xl border border-border/60 bg-secondary/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Preview:</span>
          <span
            style={{ backgroundColor: `${color}18`, color: color, borderColor: `${color}40` }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {name.trim() || 'Category Name'}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
