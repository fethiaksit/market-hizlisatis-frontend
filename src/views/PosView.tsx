import React, { useRef } from 'react';
import { Header } from '../components/Header';
import { KasaTabs } from '../components/KasaTabs';
import { BarcodeInput } from '../components/BarcodeInput';
import { QuickProductsGrid } from '../components/QuickProductsGrid';
import { CartTable } from '../components/CartTable';
import { PaymentPanel } from '../components/PaymentPanel';
import { ProductsModal } from '../components/ProductsModal';
import { CustomerModal } from '../components/CustomerModal';
import { CustomerDetailModal } from '../components/CustomerDetailModal';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';
import { ApiSettingsModal } from '../components/ApiSettingsModal';
import { AppInfo } from '../components/AppInfo';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { usePos } from '../context/PosContext';

export const PosView: React.FC = () => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { detailCustomer, setDetailCustomer } = usePos();

  // Bind global POS hotkeys (F1-F5, F7, F8, F9, F10, F12, Esc, etc.)
  useKeyboardShortcuts(barcodeInputRef);

  const focusBarcodeInput = () => {
    barcodeInputRef.current?.focus();
  };

  return (
    <div className="h-screen max-h-screen w-screen flex flex-col bg-gray-100 overflow-hidden select-none font-sans">
      {/* 1. Top Header */}
      <Header />

      {/* 2. 5 Kasa Switcher Tabs */}
      <KasaTabs />

      {/* 3. Main Workspace Grid with strictly bounded viewport height */}
      <main className="flex-1 min-h-0 p-2 sm:p-2.5 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        {/* Left Side: Barcode Input and 10 Quick Products Grid (approx 58%) */}
        <div className="lg:col-span-7 flex flex-col space-y-2 min-h-0 overflow-hidden">
          {/* Barcode & Search + "Cari Seç" + "ÜRÜNLER" Button */}
          <div className="shrink-0">
            <BarcodeInput inputRef={barcodeInputRef} />
          </div>

          {/* 10 Quick Products Grid (10 Ana Ürün) */}
          <div className="shrink-0">
            <QuickProductsGrid onProductClick={focusBarcodeInput} />
          </div>

          {/* Discreet app information button; details stay out of the sales workspace. */}
          <div className="flex flex-1 min-h-0 items-end justify-end px-1 pb-1">
            <AppInfo />
          </div>
        </div>

        {/* Right Side: Cart Table & Pinned Bottom Payment Panel (approx 42%) */}
        <div className="lg:col-span-5 flex flex-col space-y-2 min-h-0 overflow-hidden h-full">
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
