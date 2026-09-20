import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminPage } from '../types/pos';
import { 
  ShoppingBag, 
  PackageSearch,
  FolderTree,
  PackagePlus, 
  Boxes, 
  FileUp, 
  FileText,
  Tag, 
  LogOut, 
  Store,
  FileSpreadsheet,
  LayoutDashboard,
  Users
} from 'lucide-react';
import { DashboardView } from './admin/DashboardView';
import { ProductsListView } from './admin/ProductsListView';
import { ProductFormView } from './admin/ProductFormView';
import { StockEntryView } from './admin/StockEntryView';
import { BulkImportView } from './admin/BulkImportView';
import { PdfImportView } from './admin/PdfImportView';
import { PriceManagementView } from './admin/PriceManagementView';
<<<<<<< HEAD
import { CategoriesView } from './admin/CategoriesView';
=======
import { EmployeesManagementView } from './admin/EmployeesManagementView';
>>>>>>> 1957110 (Personel yonetimi ve gercek kullanici sistemi eklendi)

export const AdminView: React.FC = () => {
  const { cashier, logout, goToPos, goToEod } = useAuth();
  const [activePage, setActivePage] = useState<AdminPage>('DASHBOARD');
  const [editProductId, setEditProductId] = useState<string | number | null>(null);

  const handleLogout = () => {
    logout();
  };

  const handleEditProduct = (id: string | number) => {
    setEditProductId(id);
    setActivePage('ADD_PRODUCT');
  };

  const handleNewProduct = () => {
    setEditProductId(null);
    setActivePage('ADD_PRODUCT');
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <aside className="w-64 bg-zeytin-900 text-white flex flex-col shadow-xl shrink-0 z-10">
        <div className="p-4 border-b border-zeytin-800 flex items-center space-x-3 shrink-0">
          <div className="bg-zeytin-700 p-2 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-wide">ZEYTİN MARKET</h1>
            <p className="text-[10px] text-zeytin-300 font-bold">YÖNETİCİ PANELİ</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
          <button
            onClick={() => setActivePage('DASHBOARD')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-4 ${
              activePage === 'DASHBOARD' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Özet / Dashboard</span>
          </button>

          <div className="text-[10px] font-bold text-zeytin-400 uppercase tracking-wider mb-2 px-3">
            Katalog & Stok
          </div>
          <button
            onClick={() => setActivePage('PRODUCTS')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === 'PRODUCTS' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <PackageSearch className="w-4 h-4" />
            <span>Ürünler</span>
          </button>

          <button
            onClick={() => setActivePage('CATEGORIES')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === 'CATEGORIES' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Kategoriler</span>
          </button>
          
          <button
            onClick={handleNewProduct}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === 'ADD_PRODUCT' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>Ürün Ekle</span>
          </button>

          <button
            onClick={() => setActivePage('STOCK_ENTRY')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === 'STOCK_ENTRY' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Stok Girişi</span>
          </button>

          <button
            onClick={() => setActivePage('PRICE_MANAGEMENT')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === 'PRICE_MANAGEMENT' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Fiyat Yönetimi</span>
          </button>

          <div className="text-[10px] font-bold text-zeytin-400 uppercase tracking-wider mb-2 mt-6 px-3">
            Personel & Yetki
          </div>
          <button
            onClick={() => setActivePage('EMPLOYEES')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === 'EMPLOYEES' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Personel Yönetimi</span>
          </button>

          <div className="text-[10px] font-bold text-zeytin-400 uppercase tracking-wider mb-2 mt-6 px-3">
            Toplu İşlemler
          </div>
          <button
            onClick={() => setActivePage('PDF_IMPORT')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === 'PDF_IMPORT' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>PDF'den Ürün Aktar</span>
          </button>

          <button
            onClick={() => setActivePage('BULK_IMPORT')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === 'BULK_IMPORT' ? 'bg-zeytin-800 text-white' : 'text-zeytin-200 hover:bg-zeytin-800/50'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>CSV'den Ürün Aktar</span>
          </button>

          <div className="text-[10px] font-bold text-zeytin-400 uppercase tracking-wider mb-2 mt-6 px-3">
            Kasa İşlemleri
          </div>
          <button
            onClick={goToEod}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-zeytin-800/50 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Gün Sonu (Z-Raporu)</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zeytin-800 space-y-2 shrink-0">
          <div className="px-3 text-xs text-zeytin-300 mb-2 truncate">
            Aktif: <span className="font-bold text-white">{cashier?.name}</span>
          </div>
          
          <button
            onClick={goToPos}
            className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Satış Ekranına Geç</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sistemden Çık</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-gray-50 relative">
        {activePage === 'DASHBOARD' && (
          <DashboardView />
        )}
        {activePage === 'PRODUCTS' && (
          <ProductsListView onEditProduct={handleEditProduct} onNewProduct={handleNewProduct} />
        )}
        {activePage === 'CATEGORIES' && (
          <CategoriesView />
        )}
        {activePage === 'ADD_PRODUCT' && (
          <ProductFormView 
            productId={editProductId} 
            onClose={() => setActivePage('PRODUCTS')} 
          />
        )}
        {activePage === 'STOCK_ENTRY' && (
          <StockEntryView />
        )}
        {activePage === 'PRICE_MANAGEMENT' && (
          <PriceManagementView />
        )}
        {activePage === 'EMPLOYEES' && (
          <EmployeesManagementView />
        )}
        {activePage === 'PDF_IMPORT' && (
          <PdfImportView />
        )}
        {activePage === 'BULK_IMPORT' && (
          <BulkImportView />
        )}
      </main>
    </div>
  );
};
