import React from 'react';
import { useVault } from '../context/VaultContext.js';
import { CredentialCard } from '../components/credentials/CredentialCard.js';
import { Button } from '../components/ui/Button.js';
import { IDecryptedCredential, ICategory } from '../types/index.js';
import {
  KeyRound,
  FolderTree,
  Star,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  credentials: IDecryptedCredential[];
  categories: ICategory[];
  isLoading: boolean;
  onOpenNewItemModal: () => void;
  onOpenUnlockModal: () => void;
  onSelectCredential: (credential: IDecryptedCredential) => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  searchQuery: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  credentials,
  categories,
  isLoading,
  onOpenNewItemModal,
  onOpenUnlockModal,
  onSelectCredential,
  onToggleFavorite,
  searchQuery
}) => {
  const { isVaultUnlocked } = useVault();

  // Client-side search filtering over title, website, username, and category
  const filteredCredentials = credentials.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(q);
    const webMatch = (item.website || '').toLowerCase().includes(q);
    const userMatch = (item.decryptedData?.username || '').toLowerCase().includes(q);
    const catName =
      typeof item.categoryId === 'object' && item.categoryId
        ? (item.categoryId as any).name.toLowerCase()
        : '';
    const catMatch = catName.includes(q);
    return titleMatch || webMatch || userMatch || catMatch;
  });

  const favorites = filteredCredentials.filter((c) => c.favorite);
  const recentItems = [...filteredCredentials]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Vault Locked Warning Banner */}
      {!isVaultUnlocked && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-500 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Vault is Encrypted & Locked</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your credentials are encrypted with AES-256-GCM. Unlock your vault with your Master Password to reveal passwords and copy secrets.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenUnlockModal}
            leftIcon={<Unlock className="w-4 h-4" />}
            className="shrink-0"
          >
            Unlock Vault
          </Button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Credentials */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm hover:border-primary-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Items</span>
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-foreground">{credentials.length}</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Saved credentials</span>
        </div>

        {/* Categories */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm hover:border-primary-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Categories</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-foreground">{categories.length}</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Active folders</span>
        </div>

        {/* Favorites */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm hover:border-primary-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Favorites</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-foreground">{favorites.length}</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Starred items</span>
        </div>

        {/* Security Health */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm hover:border-primary-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Vault Shield</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-500">
            {isVaultUnlocked ? 'Protected' : 'Encrypted'}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">AES-256-GCM authenticated</span>
        </div>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="font-bold text-base text-foreground">Favorite Credentials</h3>
            </div>
            <Link
              to="/favorites"
              className="text-xs font-semibold text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.slice(0, 3).map((item) => (
              <CredentialCard
                key={item._id}
                credential={item}
                onClick={() => onSelectCredential(item)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added / Updated Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">Recently Added & Updated</h3>
            <p className="text-xs text-muted-foreground">Your most recently accessed and modified credentials</p>
          </div>
          <Link
            to="/items"
            className="text-xs font-semibold text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
          >
            All Items ({credentials.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 rounded-2xl border border-border/60 bg-secondary/20 animate-pulse" />
            ))}
          </div>
        ) : recentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.map((item) => (
              <CredentialCard
                key={item._id}
                credential={item}
                onClick={() => onSelectCredential(item)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-secondary/10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-foreground">No credentials found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No items match "${searchQuery}". Try a different keyword.`
                : 'Get started by saving your first credential securely with end-to-end encryption.'}
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenNewItemModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add First Credential
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};
