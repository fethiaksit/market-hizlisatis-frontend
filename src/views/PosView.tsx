import React, { useRef, useState } from 'react';
import { Header } from '../components/Header';
import { KasaTabs } from '../components/KasaTabs';
import { BarcodeInput } from '../components/BarcodeInput';
import { QuickProductsGrid } from '../components/QuickProductsGrid';
import { CartTable } from '../components/CartTable';
import { PaymentPanel } from '../components/PaymentPanel';
import { MobileCartDrawer } from '../components/MobileCartDrawer';
import { ProductsModal } from '../components/ProductsModal';
import { CustomerModal } from '../components/CustomerModal';
import { CustomerDetailModal } from '../components/CustomerDetailModal';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';
import { ApiSettingsModal } from '../components/ApiSettingsModal';
import { AppInfo } from '../components/AppInfo';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export const PosView: React.FC = () => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { detailCustomer, setDetailCustomer, itemsCount, totalAmount } = usePos();
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Bind global POS hotkeys (F1-F5, F7, F8, F9, F10, F12, Esc, etc.)
  useKeyboardShortcuts(barcodeInputRef);

  const focusBarcodeInput = () => {
    barcodeInputRef.current?.focus();
  };

  return (
    <div className="h-screen max-h-screen h-[100dvh] w-screen flex flex-col bg-gray-100 overflow-hidden select-none font-sans relative">
      {/* 1. Top Header */}
      <Header />

      {/* 2. 5 Kasa Switcher Tabs */}
      <KasaTabs />

      {/* 3. Main Workspace Grid */}
      <main className="flex-1 min-h-0 p-2 sm:p-2.5 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        {/* Left Side: Barcode Input, 10 Quick Products Grid & Shortcuts (Desktop ~58%, Mobile full) */}
        <div className="lg:col-span-7 flex flex-col space-y-2 min-h-0 overflow-y-auto lg:overflow-hidden pb-16 lg:pb-0">
          {/* Barcode & Search + "Cari Seç" + "ÜRÜNLER" Button + Kamera */}
          <div className="shrink-0">
            <BarcodeInput inputRef={barcodeInputRef} />
          </div>

          {/* 10 Quick Products Grid (Favori Ürünler) */}
          <div className="shrink-0">
            <QuickProductsGrid onProductClick={focusBarcodeInput} />
          </div>

          {/* POS Information & Operational Shortcuts Card (Visible on Desktop/Large tablet) */}
          <div className="hidden lg:flex flex-1 min-h-0 bg-white rounded-xl border border-gray-200 p-2.5 shadow-2xs flex-col justify-between overflow-hidden">
            <div className="space-y-1.5 overflow-y-auto">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Klavye Kısayolları
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs text-gray-600">
                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                  <span className="font-black text-zeytin-700 block font-mono text-[10px]">F1 - F5</span>
                  <span className="text-[10px]">Kasa 1-5 Geçişi</span>
                </div>
                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                  <span className="font-black text-zeytin-700 block font-mono text-[10px]">F8 / F9 / F7</span>
                  <span className="text-[10px]">Nakit / Kart / Cari</span>
                </div>
                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                  <span className="font-black text-zeytin-700 block font-mono text-[10px]">F10</span>
                  <span className="text-[10px]">Ürün Kataloğu</span>
                </div>
                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                  <span className="font-black text-zeytin-700 block font-mono text-[10px]">F12 / Enter</span>
                  <span className="text-[10px]">Satışı Tamamla</span>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 shrink-0">
              <span>USB Barkod okuyucu klavye modunda kesintisiz çalışır.</span>
              <div className="flex items-center space-x-2">
                <AppInfo />
                <span className="font-mono font-bold text-zeytin-700">POS HAZIR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (Desktop >= 1024px only): Cart Table & Pinned Bottom Payment Panel */}
        <div className="hidden lg:flex lg:col-span-5 flex-col space-y-2 min-h-0 overflow-hidden h-full">
          {/* Cart Table (Items, Qty, internally scrollable) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CartTable onItemUpdated={focusBarcodeInput} />
          </div>

          {/* Pinned Bottom Payment & Complete Sale Panel */}
          <div className="shrink-0">
            <PaymentPanel onSaleCompleted={focusBarcodeInput} />
          </div>
        </div>
      </main>

      {/* 4. Mobile Fixed Bottom Sales Bar (Mobile < 1024px only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-gray-900 via-zeytin-950 to-gray-900 border-t border-gray-800 px-3 py-2 sm:py-2.5 shadow-2xl flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMobileCartOpen(true)}
          className="flex items-center space-x-2.5 text-left cursor-pointer active:scale-95 transition-transform"
        >
          <div className="relative p-2 bg-zeytin-700 text-white rounded-xl shadow-inner">
            <ShoppingCart className="w-5 h-5" />
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-gray-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {itemsCount}
              </span>
            )}
          </div>
          <div>
            <span className="text-[11px] text-gray-300 font-bold block">
              Sepet ({itemsCount})
            </span>
            <span className="text-base sm:text-lg font-black text-white leading-tight">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileCartOpen(true)}
          className="bg-zeytin-600 hover:bg-zeytin-500 active:bg-zeytin-700 text-white font-extrabold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow-lg active:scale-95 transition-all border border-zeytin-500 min-h-[44px]"
        >
          <span>Ödeme</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Mobile Cart Bottom Sheet Drawer */}
      <MobileCartDrawer 
        isOpen={isMobileCartOpen} 
        onClose={() => setIsMobileCartOpen(false)} 
      />

      {/* Modals & Floating Notifications */}
      <ProductsModal />
      <CustomerModal />
      {detailCustomer && (
        <CustomerDetailModal
          customer={detailCustomer}
          onClose={() => setDetailCustomer(null)}
        />
      )}
      <LogoutConfirmModal />
      <ApiSettingsModal />
    </div>
  );
};
