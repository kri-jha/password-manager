import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  KeyRound,
  Star,
  FolderTree,
  Dices,
  ShieldAlert,
  Settings,
  Lock,
  Unlock,
  LogOut,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useVault } from '../../context/VaultContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUnlockModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenUnlockModal }) => {
  const { user, logout } = useAuth();
  const { isVaultUnlocked, lockVault } = useVault();

  const navItems = [
    { label: 'Overview', to: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'All Items', to: '/items', icon: <KeyRound className="w-5 h-5" /> },
    { label: 'Favorites', to: '/favorites', icon: <Star className="w-5 h-5" /> },
    { label: 'Categories', to: '/categories', icon: <FolderTree className="w-5 h-5" /> },
    { label: 'Password Generator', to: '/generator', icon: <Dices className="w-5 h-5" /> },
    { label: 'Security', to: '/security', icon: <ShieldAlert className="w-5 h-5" /> },
    { label: 'Settings', to: '/settings', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-card/95 border-r border-border/80 flex flex-col backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                Aegis Vault
              </span>
              <span className="block text-[10px] uppercase font-semibold text-primary-500 tracking-wider">
                Zero-Knowledge
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vault Status Widget */}
        <div className="px-4 py-3 mx-4 my-3 rounded-2xl border border-border/60 bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Vault Status</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isVaultUnlocked
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isVaultUnlocked ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isVaultUnlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>

          {isVaultUnlocked ? (
            <button
              onClick={lockVault}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Lock Vault Now
            </button>
          ) : (
            <button
              onClick={onOpenUnlockModal}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/20 transition-all"
            >
              <Unlock className="w-3.5 h-3.5" />
              Unlock Vault
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border/60 bg-secondary/10 flex items-center justify-between">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-semibold text-foreground truncate">
              {user?.email || 'User'}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              Account Active
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
