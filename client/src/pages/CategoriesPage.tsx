import React, { useState } from 'react';
import { Button } from '../components/ui/Button.js';
import { CategoryDialog } from '../components/categories/CategoryDialog.js';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.js';
import { useToast } from '../context/ToastContext.js';
import { categoryService } from '../services/categoryService.js';
import { ICategory, IDecryptedCredential } from '../types/index.js';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Folder,
  Globe,
  Briefcase,
  CreditCard,
  Key,
  Shield,
  Server,
  Smartphone,
  Cloud,
  Mail
} from 'lucide-react';

interface CategoriesPageProps {
  categories: ICategory[];
  credentials: IDecryptedCredential[];
  onRefreshCategories: () => void;
  onRefreshCredentials: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  folder: <Folder className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />,
  'credit-card': <CreditCard className="w-5 h-5" />,
  key: <Key className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  server: <Server className="w-5 h-5" />,
  smartphone: <Smartphone className="w-5 h-5" />,
  cloud: <Cloud className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />
};

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  credentials,
  onRefreshCategories,
  onRefreshCredentials
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);

  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: ICategory) => {
    setEditingCategory(cat);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const res = await categoryService.deleteCategory(categoryToDelete._id);
      toastSuccess(`Category deleted. ${res.affectedCredentials} item(s) moved to Uncategorized.`);
      onRefreshCategories();
      onRefreshCredentials();
      setCategoryToDelete(null);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to count credentials per category
  const getItemCount = (categoryId: string) => {
    return credentials.filter((cred) => {
      const id =
        typeof cred.categoryId === 'object' && cred.categoryId !== null
          ? (cred.categoryId as any)._id
          : cred.categoryId;
      return id === categoryId;
    }).length;
  };

  const uncategorizedCount = credentials.filter((c) => !c.categoryId).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Categories</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize credentials into custom groups with distinct badges and icons
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md shadow-primary-500/20 shrink-0"
        >
          Create Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Uncategorized Built-in Folder */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Uncategorized</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {uncategorizedCount} credential{uncategorizedCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
            Default
          </span>
        </div>

        {/* User Categories */}
        {categories.map((cat) => {
          const count = getItemCount(cat._id);
          const icon = ICON_MAP[cat.icon] || <Folder className="w-5 h-5" />;

          return (
            <div
              key={cat._id}
              className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm hover:border-border transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                  >
                    {icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{cat.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {count} credential{count === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCategoryToDelete(cat)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.color}
                </span>
                <span>Icon: {cat.icon}</span>
              </div>
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="p-16 text-center rounded-2xl border border-dashed border-border/80 bg-secondary/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <FolderTree className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-base text-foreground">No custom categories yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create categories to organize your personal, work, financial, and cloud credentials.
          </p>
          <Button size="sm" variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Create Category
          </Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <CategoryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => {
          onRefreshCategories();
          onRefreshCredentials();
        }}
        initialCategory={editingCategory}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? All credentials in this category will be moved to Uncategorized.`}
        confirmLabel="Delete Category"
        isLoading={isDeleting}
      />
    </div>
  );
};
