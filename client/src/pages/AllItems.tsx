import React, { useState } from 'react';
import { CredentialCard } from '../components/credentials/CredentialCard.js';
import { Button } from '../components/ui/Button.js';
import { IDecryptedCredential, ICategory } from '../types/index.js';
import { KeyRound, Plus, Filter, ArrowUpDown } from 'lucide-react';

interface AllItemsProps {
  credentials: IDecryptedCredential[];
  categories: ICategory[];
  isLoading: boolean;
  onOpenNewItemModal: () => void;
  onSelectCredential: (credential: IDecryptedCredential) => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  searchQuery: string;
}

export const AllItems: React.FC<AllItemsProps> = ({
  credentials,
  categories,
  isLoading,
  onOpenNewItemModal,
  onSelectCredential,
  onToggleFavorite,
  searchQuery
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'createdAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter by category and search query
  const filtered = credentials.filter((item) => {
    // 1. Category Filter
    if (selectedCategory !== 'all') {
      const catId =
        typeof item.categoryId === 'object' && item.categoryId !== null
          ? (item.categoryId as any)._id
          : item.categoryId;

      if (selectedCategory === 'uncategorized') {
        if (catId) return false;
      } else if (catId !== selectedCategory) {
        return false;
      }
    }

    // 2. Search Query (Client-side zero-knowledge search over title, website, decrypted username)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(q);
      const webMatch = (item.website || '').toLowerCase().includes(q);
      const userMatch = (item.decryptedData?.username || '').toLowerCase().includes(q);
      return titleMatch || webMatch || userMatch;
    }

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'title') {
      return sortOrder === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    const timeA = new Date(a[sortBy]).getTime();
    const timeB = new Date(b[sortBy]).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">All Credentials</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage, search, and retrieve all stored secrets ({credentials.length} total)
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

      {/* Filter and Sorting Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/70 bg-card">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            All Items ({credentials.length})
          </button>

          <button
            onClick={() => setSelectedCategory('uncategorized')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedCategory === 'uncategorized'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            Uncategorized
          </button>

          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategory(c._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                selectedCategory === c._id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          ))}
        </div>

        {/* Sorting Dropdowns */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span>Sort by:</span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 px-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="updatedAt">Last Modified</option>
            <option value="createdAt">Date Created</option>
            <option value="title">Name</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-xl border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Credentials */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-40 rounded-2xl border border-border/60 bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((item) => (
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
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-base text-foreground">No credentials found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No items match the search query "${searchQuery}".`
              : 'There are no credentials matching this filter.'}
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenNewItemModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Item
          </Button>
        </div>
      )}
    </div>
  );
};
