import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { useVault } from '../../context/VaultContext.js';
import { useToast } from '../../context/ToastContext.js';
import { categoryService } from '../../services/categoryService.js';
import { credentialService } from '../../services/credentialService.js';
import { ICategory, ICredential, ICustomField, IDecryptedCredential } from '../../types/index.js';
import { calculatePasswordStrength, generateSecurePassword } from '../../crypto/vaultCrypto.js';
import {
  KeyRound,
  Globe,
  User,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Trash2,
  FolderPlus
} from 'lucide-react';

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  website: z.string().trim().max(255).optional(),
  categoryId: z.string().optional(),
  username: z.string().trim().optional(),
  password: z.string().min(1, 'Password or secret is required'),
  recoveryEmail: z.string().trim().optional(),
  recoveryPhone: z.string().trim().optional(),
  twoFactorNotes: z.string().optional(),
  recoveryCodesText: z.string().optional(),
  securityNotes: z.string().optional(),
  favorite: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

interface CredentialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credential: ICredential) => void;
  initialData?: IDecryptedCredential | null;
  categories: ICategory[];
  onRefreshCategories: () => void;
}

export const CredentialFormModal: React.FC<CredentialFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  categories,
  onRefreshCategories
}) => {
  const { encryptSecret, isVaultUnlocked } = useVault();
  const { success: toastSuccess, error: toastError } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [customFields, setCustomFields] = useState<ICustomField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      website: '',
      categoryId: '',
      username: '',
      password: '',
      recoveryEmail: '',
      recoveryPhone: '',
      twoFactorNotes: '',
      recoveryCodesText: '',
      securityNotes: '',
      favorite: false
    }
  });

  const currentPassword = watch('password');
  const passwordStrength = calculatePasswordStrength(currentPassword || '');

  // Populate initial data when editing
  useEffect(() => {
    if (initialData) {
      const dec = initialData.decryptedData || {};
      reset({
        title: initialData.title || '',
        website: initialData.website || '',
        categoryId: typeof initialData.categoryId === 'object' ? (initialData.categoryId as any)?._id : initialData.categoryId || '',
        username: dec.username || '',
        password: dec.password || '',
        recoveryEmail: dec.recoveryEmail || '',
        recoveryPhone: dec.recoveryPhone || '',
        twoFactorNotes: dec.twoFactorNotes || '',
        recoveryCodesText: (dec.recoveryCodes || []).join('\n'),
        securityNotes: dec.securityNotes || '',
        favorite: !!initialData.favorite
      });
      setCustomFields(dec.customFields || []);
    } else {
      reset({
        title: '',
        website: '',
        categoryId: '',
        username: '',
        password: '',
        recoveryEmail: '',
        recoveryPhone: '',
        twoFactorNotes: '',
        recoveryCodesText: '',
        securityNotes: '',
        favorite: false
      });
      setCustomFields([]);
    }
  }, [initialData, reset, isOpen]);

  // Handle Quick Password Generation
  const handleQuickGeneratePassword = () => {
    const generated = generateSecurePassword({
      length: 20,
      useUppercase: true,
      useLowercase: true,
      useNumbers: true,
      useSymbols: true,
      excludeAmbiguous: true
    });
    setValue('password', generated, { shouldValidate: true });
    setShowPassword(true);
  };

  // Handle Inline Category Creation
  const handleCreateCategoryInline = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await categoryService.createCategory({
        name: newCategoryName.trim(),
        icon: 'folder',
        color: '#6366f1'
      });
      onRefreshCategories();
      setValue('categoryId', created._id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
      toastSuccess(`Category "${created.name}" created!`);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create category.');
    }
  };

  // Add / Remove custom fields
  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: Math.random().toString(36).substring(2, 9), label: '', value: '', isSecret: false }
    ]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: Partial<ICustomField>) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...field };
    setCustomFields(updated);
  };

  const onSubmit = async (values: FormValues) => {
    if (!isVaultUnlocked) {
      toastError('Vault is locked. Please unlock the vault first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const recoveryCodes = values.recoveryCodesText
        ? values.recoveryCodesText
            .split('\n')
            .map((c) => c.trim())
            .filter(Boolean)
        : [];

      // Sensitive data payload for zero-knowledge client encryption
      const secretData = {
        username: values.username || '',
        password: values.password,
        recoveryEmail: values.recoveryEmail || '',
        recoveryPhone: values.recoveryPhone || '',
        twoFactorNotes: values.twoFactorNotes || '',
        recoveryCodes,
        securityNotes: values.securityNotes || '',
        customFields: customFields.filter((f) => f.label.trim())
      };

      // Encrypt locally using Web Crypto AES-256-GCM
      const encryptedSecretPayload = await encryptSecret(secretData);

      const payload = {
        title: values.title,
        website: values.website || '',
        categoryId: values.categoryId || null,
        encryptedSecretPayload,
        encryptionVersion: 1,
        favorite: values.favorite
      };

      let result: ICredential;
      if (initialData?._id) {
        result = await credentialService.updateCredential(initialData._id, payload);
        toastSuccess('Credential updated successfully!');
      } else {
        result = await credentialService.createCredential(payload);
        toastSuccess('Credential added to vault!');
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to save credential.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Credential' : 'Add New Credential'}
      description="Zero-Knowledge AES-256-GCM client-side encrypted"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Title *"
            placeholder="e.g. Personal Gmail, AWS Console"
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="Website URL or App Name"
            placeholder="e.g. https://google.com"
            startAdornment={<Globe className="w-4 h-4" />}
            error={errors.website?.message}
            {...register('website')}
          />
        </div>

        {/* Category Selector + Inline Creation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-foreground/80 tracking-wide">Category</label>
            <button
              type="button"
              onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              className="text-xs text-primary-500 hover:underline flex items-center gap-1 font-medium"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              {isCreatingCategory ? 'Cancel' : '+ New Category'}
            </button>
          </div>

          {isCreatingCategory ? (
            <div className="flex items-center gap-2 p-2 rounded-xl border border-primary-500/30 bg-primary-500/5">
              <input
                type="text"
                placeholder="Category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 h-8 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <Button type="button" size="sm" onClick={handleCreateCategoryInline}>
                Add
              </Button>
            </div>
          ) : (
            <select
              className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              {...register('categoryId')}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Credentials Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Username or Email"
            placeholder="e.g. user@example.com"
            startAdornment={<User className="w-4 h-4" />}
            {...register('username')}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-foreground/80 tracking-wide">Password *</label>
              <button
                type="button"
                onClick={handleQuickGeneratePassword}
                className="text-xs text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate
              </button>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter or generate password..."
              startAdornment={<KeyRound className="w-4 h-4" />}
              error={errors.password?.message}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password')}
            />
            {currentPassword && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        step <= passwordStrength.score ? passwordStrength.color : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recovery Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Recovery Email"
            placeholder="backup@example.com"
            {...register('recoveryEmail')}
          />
          <Input
            label="Recovery Phone"
            placeholder="+1 555-0199"
            {...register('recoveryPhone')}
          />
        </div>

        {/* 2FA & Recovery Codes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/80 tracking-wide">
            Two-Factor Authentication (2FA) Notes / Seeds
          </label>
          <textarea
            rows={2}
            placeholder="Backup seeds, TOTP instructions, or security keys..."
            className="w-full p-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            {...register('twoFactorNotes')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/80 tracking-wide">
            Recovery Codes (one per line)
          </label>
          <textarea
            rows={3}
            placeholder="ABCD-1234&#10;EFGH-5678&#10;IJKL-9012"
            className="w-full p-3 font-mono rounded-xl border border-border bg-secondary/30 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            {...register('recoveryCodesText')}
          />
        </div>

        {/* Custom Fields */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/80">Custom Fields</span>
            <button
              type="button"
              onClick={addCustomField}
              className="text-xs text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Field
            </button>
          </div>

          {customFields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Label (e.g. PIN, API Key)"
                value={field.label}
                onChange={(e) => updateCustomField(idx, { label: e.target.value })}
                className="w-1/3 h-9 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <input
                type={field.isSecret ? 'password' : 'text'}
                placeholder="Value"
                value={field.value}
                onChange={(e) => updateCustomField(idx, { value: e.target.value })}
                className="flex-1 h-9 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => updateCustomField(idx, { isSecret: !field.isSecret })}
                className="p-2 text-muted-foreground hover:text-foreground"
                title={field.isSecret ? 'Mark as plain' : 'Mark as secret'}
              >
                {field.isSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => removeCustomField(idx)}
                className="p-2 text-muted-foreground hover:text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Favorite Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="favorite-checkbox"
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-border bg-secondary"
            {...register('favorite')}
          />
          <label htmlFor="favorite-checkbox" className="text-xs font-medium text-foreground select-none cursor-pointer">
            Mark as Favorite
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Shield className="w-4 h-4" />}
          >
            {initialData ? 'Save Changes' : 'Encrypt & Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
