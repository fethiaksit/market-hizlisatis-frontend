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
  Users,
  Contact,
  Menu,
  X
} from 'lucide-react';
import { DashboardView } from './admin/DashboardView';
import { ProductsListView } from './admin/ProductsListView';
import { ProductFormView } from './admin/ProductFormView';
import { StockEntryView } from './admin/StockEntryView';
import { BulkImportView } from './admin/BulkImportView';
import { PdfImportView } from './admin/PdfImportView';
import { PriceManagementView } from './admin/PriceManagementView';
import { CategoriesView } from './admin/CategoriesView';
import { EmployeesManagementView } from './admin/EmployeesManagementView';
import { CustomersManagementView } from './admin/CustomersManagementView';

const PAGE_TITLES: Record<AdminPage, string> = {
  DASHBOARD: 'Özet Dashboard',
  PRODUCTS: 'Ürün Yönetimi',
  CATEGORIES: 'Kategori Yönetimi',
  ADD_PRODUCT: 'Ürün Ekle / Düzenle',
  STOCK_ENTRY: 'Stok Girişi',
  PRICE_MANAGEMENT: 'Fiyat Yönetimi',
  CUSTOMERS: 'Cari Müşteriler',
  EMPLOYEES: 'Personel Yönetimi',
  PDF_IMPORT: "PDF'den Ürün Aktar",
  BULK_IMPORT: "CSV'den Ürün Aktar",
};

export const AdminView: React.FC = () => {
  const { cashier, logout, goToPos, goToEod } = useAuth();
  const [activePage, setActivePage] = useState<AdminPage>('DASHBOARD');
  const [editProductId, setEditProductId] = useState<string | number | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleEditProduct = (id: string | number) => {
    setEditProductId(id);
    setActivePage('ADD_PRODUCT');
    setIsMobileDrawerOpen(false);
  };

  const handleNewProduct = () => {
    setEditProductId(null);
    setActivePage('ADD_PRODUCT');
    setIsMobileDrawerOpen(false);
  };

  const handleSelectPage = (page: AdminPage) => {
    setActivePage(page);
    setIsMobileDrawerOpen(false);
  };

  const renderNavLinks = () => (
    <>
      <button
        onClick={() => handleSelectPage('DASHBOARD')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-4 min-h-[44px] cursor-pointer ${
          activePage === 'DASHBOARD' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Özet / Dashboard</span>
      </button>

      <div className="text-[10px] font-bold text-zeytin-400 uppercase tracking-wider mb-2 px-3">
        Katalog & Stok
      </div>
      <button
        onClick={() => handleSelectPage('PRODUCTS')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'PRODUCTS' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <PackageSearch className="w-5 h-5 text-emerald-400" />
        <span>Ürünler</span>
      </button>

      <button
        onClick={() => handleSelectPage('CATEGORIES')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'CATEGORIES' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <FolderTree className="w-5 h-5 text-amber-400" />
        <span>Kategoriler</span>
      </button>
      
      <button
        onClick={handleNewProduct}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'ADD_PRODUCT' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <PackagePlus className="w-5 h-5 text-blue-400" />
        <span>Ürün Ekle</span>
      </button>

      <button
        onClick={() => handleSelectPage('STOCK_ENTRY')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'STOCK_ENTRY' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <Boxes className="w-5 h-5 text-teal-400" />
        <span>Stok Girişi</span>
      </button>

      <button
        onClick={() => handleSelectPage('PRICE_MANAGEMENT')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'PRICE_MANAGEMENT' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <Tag className="w-5 h-5 text-amber-300" />
        <span>Fiyat Yönetimi</span>
      </button>

      <div className="text-[10px] font-bold text-zeytin-400 uppercase tracking-wider mb-2 mt-6 px-3">
        Müşteri & Personel
      </div>
      <button
        onClick={() => handleSelectPage('CUSTOMERS')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'CUSTOMERS' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <Contact className="w-5 h-5 text-emerald-400" />
        <span>Cari Müşteriler</span>
      </button>

      <button
        onClick={() => handleSelectPage('EMPLOYEES')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'EMPLOYEES' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <Users className="w-5 h-5 text-amber-400" />
        <span>Personel Yönetimi</span>
      </button>

      <div className="text-[10px] font-bold text-zeytin-400 uppercase tracking-wider mb-2 mt-6 px-3">
        Toplu İşlemler
      </div>
      <button
        onClick={() => handleSelectPage('PDF_IMPORT')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'PDF_IMPORT' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <FileText className="w-5 h-5 text-blue-400" />
        <span>PDF'den Ürün Aktar</span>
      </button>

      <button
        onClick={() => handleSelectPage('BULK_IMPORT')}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
          activePage === 'BULK_IMPORT' ? 'bg-zeytin-800 text-white font-bold' : 'text-zeytin-200 hover:bg-zeytin-800/50'
        }`}
      >
        <FileUp className="w-5 h-5 text-violet-400" />
        <span>CSV'den Ürün Aktar</span>
      </button>

      <div className="text-[10px] font-bold text-zeytin-400 uppercase tracking-wider mb-2 mt-6 px-3">
        Kasa İşlemleri
      </div>
      <button
        onClick={() => {
          setIsMobileDrawerOpen(false);
          goToEod();
        }}
        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-zeytin-800/50 transition-all min-h-[44px] cursor-pointer"
      >
        <FileSpreadsheet className="w-5 h-5" />
        <span>Gün Sonu (Z-Raporu)</span>
      </button>
    </>
  );

  return (
    <div className="h-screen max-h-screen h-[100dvh] w-screen flex flex-col lg:flex-row bg-gray-50 overflow-hidden font-sans select-none">
      {/* 1. Desktop Sidebar (Desktop >= 1024px) */}
      <aside className="hidden lg:flex w-64 bg-zeytin-900 text-white flex-col shadow-xl shrink-0 z-20">
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
          {renderNavLinks()}
        </nav>

        <div className="p-4 border-t border-zeytin-800 space-y-2 shrink-0">
          <div className="px-3 text-xs text-zeytin-300 mb-2 truncate">
            Aktif: <span className="font-bold text-white">{cashier?.name}</span>
          </div>
          
          <button
            onClick={goToPos}
            className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Satış Ekranına Geç</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sistemden Çık</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Header Bar (Mobile & Tablet < 1024px) */}
      <div className="lg:hidden bg-zeytin-900 text-white px-3 py-2.5 flex items-center justify-between border-b border-zeytin-950 shrink-0 z-10 shadow-md">
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-zeytin-800 hover:bg-zeytin-700 active:bg-zeytin-600 text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-black text-sm text-white line-clamp-1">
              {PAGE_TITLES[activePage] || 'Yönetici Paneli'}
            </h2>
            <span className="text-[10px] text-zeytin-300 font-bold block">
              ZeytinERP Yönetim
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={goToPos}
            className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs min-h-[44px]"
            title="Satış Ekranına Geç"
          >
            <Store className="w-4 h-4" />
            <span className="hidden xs:inline">Satış</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-red-300 hover:text-red-200 bg-red-950/60 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Mobile Slide-Over Drawer Navigation */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="relative w-72 max-w-[85vw] bg-zeytin-900 text-white flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-250 h-full">
            <div className="p-4 border-b border-zeytin-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="bg-zeytin-700 p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="font-black text-sm tracking-wide">ZEYTİN MARKET</h1>
                  <p className="text-[10px] text-zeytin-300 font-bold">YÖNETİCİ PANELİ</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl bg-zeytin-800 hover:bg-zeytin-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
              {renderNavLinks()}
            </nav>

            <div className="p-4 border-t border-zeytin-800 space-y-2 shrink-0">
              <div className="px-3 text-xs text-zeytin-300 mb-1 truncate">
                Aktif: <span className="font-bold text-white">{cashier?.name}</span>
              </div>
              
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  goToPos();
                }}
                className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer min-h-[44px]"
              >
                <Store className="w-4 h-4" />
                <span>Satış Ekranına Geç</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 4. Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-gray-50 relative min-h-0">
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
        {activePage === 'CUSTOMERS' && (
          <CustomersManagementView />
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
