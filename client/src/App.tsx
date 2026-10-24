import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { useVault } from './context/VaultContext.js';
import { useToast } from './context/ToastContext.js';
import { credentialService } from './services/credentialService.js';
import { categoryService } from './services/categoryService.js';
import { ICredential, IDecryptedCredential, ICategory } from './types/index.js';

// Layout & Modals
import { AppLayout } from './components/layout/AppLayout.js';
import { MasterPasswordModal } from './components/vault/MasterPasswordModal.js';
import { CredentialDetailModal } from './components/credentials/CredentialDetailModal.js';
import { CredentialFormModal } from './components/credentials/CredentialFormModal.js';
import { ConfirmationDialog } from './components/ui/ConfirmationDialog.js';

// Pages
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { Dashboard } from './pages/Dashboard.js';
import { AllItems } from './pages/AllItems.js';
import { Favorites } from './pages/Favorites.js';
import { CategoriesPage } from './pages/CategoriesPage.js';
import { GeneratorPage } from './pages/GeneratorPage.js';
import { SecurityPage } from './pages/SecurityPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isVaultUnlocked, decryptCredentialItem } = useVault();
  const { success: toastSuccess, error: toastError } = useToast();

  const [rawCredentials, setRawCredentials] = useState<ICredential[]>([]);
  const [decryptedCredentials, setDecryptedCredentials] = useState<IDecryptedCredential[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<IDecryptedCredential | null>(null);
  const [editingCredential, setEditingCredential] = useState<IDecryptedCredential | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<IDecryptedCredential | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [credsRes, catsRes] = await Promise.all([
        credentialService.getCredentials({ limit: 100 }),
        categoryService.getCategories()
      ]);
      setRawCredentials(credsRes.data);
      setCategories(catsRes);
    } catch (err: any) {
      console.error('Failed to load vault data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Zero-knowledge in-memory decryption effect
  useEffect(() => {
    let isCancelled = false;

    async function processDecryption() {
      if (!isVaultUnlocked) {
        // Vault is locked: keep only non-secret metadata in memory, purge plaintext secrets!
        setDecryptedCredentials(rawCredentials.map((c) => ({ ...c, decryptedData: undefined })));
        return;
      }

      const decryptedList: IDecryptedCredential[] = [];
      for (const cred of rawCredentials) {
        if (isCancelled) return;
        const decrypted = await decryptCredentialItem(cred);
        decryptedList.push(decrypted);
      }

      if (!isCancelled) {
        setDecryptedCredentials(decryptedList);
      }
    }

    processDecryption();

    return () => {
      isCancelled = true;
    };
  }, [rawCredentials, isVaultUnlocked, decryptCredentialItem]);

  // Keep selectedCredential in sync with decrypted updates
  useEffect(() => {
    if (selectedCredential) {
      const updated = decryptedCredentials.find((c) => c._id === selectedCredential._id);
      if (updated) setSelectedCredential(updated);
    }
  }, [decryptedCredentials]);

  // Handle Toggle Favorite
  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const updated = await credentialService.toggleFavorite(id);
      setRawCredentials((prev) =>
        prev.map((c) => (c._id === id ? { ...c, favorite: updated.favorite } : c))
      );
    } catch {
      toastError('Failed to update favorite status.');
    }
  };

  // Handle Delete Credential
  const handleDeleteConfirm = async () => {
    if (!credentialToDelete) return;
    setIsDeleting(true);
    try {
      await credentialService.deleteCredential(credentialToDelete._id);
      setRawCredentials((prev) => prev.filter((c) => c._id !== credentialToDelete._id));
      toastSuccess('Credential deleted from vault.');
      setCredentialToDelete(null);
      setSelectedCredential(null);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete credential.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Initializing Secure Session...</p>
      </div>
    );
  }

  // Unauthenticated Routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated Routes
  return (
    <>
      <Routes>
        <Route
          element={
            <AppLayout
              categories={categories}
              onRefreshCategories={fetchData}
              onRefreshCredentials={fetchData}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
        >
          <Route
            path="/"
            element={
              <Dashboard
                credentials={decryptedCredentials}
                categories={categories}
                isLoading={isLoadingData}
                onOpenNewItemModal={() => {
                  setEditingCredential(null);
                  setIsFormModalOpen(true);
                }}
                onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
                onSelectCredential={(c) => setSelectedCredential(c)}
                onToggleFavorite={handleToggleFavorite}
                searchQuery={searchQuery}
              />
            }
          />
          <Route
            path="/items"
            element={
              <AllItems
                credentials={decryptedCredentials}
                categories={categories}
                isLoading={isLoadingData}
                onOpenNewItemModal={() => {
                  setEditingCredential(null);
                  setIsFormModalOpen(true);
                }}
                onSelectCredential={(c) => setSelectedCredential(c)}
                onToggleFavorite={handleToggleFavorite}
                searchQuery={searchQuery}
              />
            }
          />
          <Route
            path="/favorites"
            element={
              <Favorites
                credentials={decryptedCredentials}
                isLoading={isLoadingData}
                onOpenNewItemModal={() => {
                  setEditingCredential(null);
                  setIsFormModalOpen(true);
                }}
                onSelectCredential={(c) => setSelectedCredential(c)}
                onToggleFavorite={handleToggleFavorite}
                searchQuery={searchQuery}
              />
            }
          />
          <Route
            path="/categories"
            element={
              <CategoriesPage
                categories={categories}
                credentials={decryptedCredentials}
                onRefreshCategories={fetchData}
                onRefreshCredentials={fetchData}
              />
            }
          />
          <Route path="/generator" element={<GeneratorPage />} />
          <Route
            path="/security"
            element={
              <SecurityPage
                credentials={decryptedCredentials}
                onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
                onSelectCredential={(c) => setSelectedCredential(c)}
              />
            }
          />
          <Route
            path="/settings"
            element={<SettingsPage credentials={decryptedCredentials} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* Global Modals */}

      {/* Master Password Unlock Modal */}
      <MasterPasswordModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* View Credential Detail Modal */}
      <CredentialDetailModal
        isOpen={!!selectedCredential}
        onClose={() => setSelectedCredential(null)}
        credential={selectedCredential}
        onEdit={(cred) => {
          setEditingCredential(cred);
          setIsFormModalOpen(true);
        }}
        onDelete={(cred) => setCredentialToDelete(cred)}
        onToggleFavorite={(id) => handleToggleFavorite({ stopPropagation: () => {} } as any, id)}
        onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
      />

      {/* Add / Edit Credential Form Modal */}
      <CredentialFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCredential(null);
        }}
        onSuccess={() => {
          fetchData();
          setIsFormModalOpen(false);
          setEditingCredential(null);
        }}
        initialData={editingCredential}
        categories={categories}
        onRefreshCategories={fetchData}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!credentialToDelete}
        onClose={() => setCredentialToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Credential"
        message={`Are you sure you want to permanently delete "${credentialToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};
