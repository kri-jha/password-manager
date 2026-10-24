import React from 'react';
import { CredentialCard } from '../components/credentials/CredentialCard.js';
import { Button } from '../components/ui/Button.js';
import { IDecryptedCredential } from '../types/index.js';
import { Star, Plus } from 'lucide-react';

interface FavoritesProps {
  credentials: IDecryptedCredential[];
  isLoading: boolean;
  onOpenNewItemModal: () => void;
  onSelectCredential: (credential: IDecryptedCredential) => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  searchQuery: string;
}

export const Favorites: React.FC<FavoritesProps> = ({
  credentials,
  isLoading,
  onOpenNewItemModal,
  onSelectCredential,
  onToggleFavorite,
  searchQuery
}) => {
  const favorites = credentials
    .filter((c) => c.favorite)
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.website || '').toLowerCase().includes(q) ||
        (item.decryptedData?.username || '').toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Favorites</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quick access to your most frequently used credentials ({favorites.length} items)
          </p>
        </div>

        <Button
          variant="primary"
          onClick={onOpenNewItemModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md shadow-primary-500/20 shrink-0"
        >
          Add New Item
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 rounded-2xl border border-border/60 bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((item) => (
            <CredentialCard
              key={item._id}
              credential={item}
              onClick={() => onSelectCredential(item)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center rounded-2xl border border-dashed border-border/80 bg-secondary/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-base text-foreground">No favorite credentials yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click the star icon on any credential card to pin it here for instant access.
          </p>
        </div>
      )}
    </div>
  );
};
