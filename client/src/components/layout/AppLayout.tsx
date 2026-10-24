import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { MasterPasswordModal } from '../vault/MasterPasswordModal.js';
import { CredentialFormModal } from '../credentials/CredentialFormModal.js';
import { ICategory } from '../../types/index.js';

interface AppLayoutProps {
  categories: ICategory[];
  onRefreshCategories: () => void;
  onRefreshCredentials: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  categories,
  onRefreshCategories,
  onRefreshCredentials,
  searchQuery,
  onSearchChange
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Global Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenNewItemModal={() => setIsNewItemModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Page Content Slot */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Vault Unlock Modal */}
      <MasterPasswordModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onSuccess={onRefreshCredentials}
      />

      {/* Add New Credential Modal */}
      <CredentialFormModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        onSuccess={() => {
          onRefreshCredentials();
          setIsNewItemModalOpen(false);
        }}
        categories={categories}
        onRefreshCategories={onRefreshCategories}
      />
    </div>
  );
};
