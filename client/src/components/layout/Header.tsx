import React from 'react';
import { Menu, Plus, Search, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { ThemeToggle } from './ThemeToggle.js';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenNewItemModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenNewItemModal,
  searchQuery,
  onSearchChange
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-48 sm:w-72 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search credentials, websites, usernames..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-10 pr-4 rounded-xl border border-border bg-secondary/30 text-xs md:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Encryption Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>E2EE 256-bit</span>
        </div>

        <ThemeToggle />

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewItemModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md shadow-primary-500/20"
        >
          <span className="hidden sm:inline">Add Item</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
};
