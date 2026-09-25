import React, { useState, useEffect } from 'react';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { Barcode, Search, LayoutGrid, Delete, UserCheck, UserPlus, X, History, Camera } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

interface BarcodeInputProps {
  inputRef: React.RefObject<HTMLInputElement>;
}

export const BarcodeInput: React.FC<BarcodeInputProps> = ({ inputRef }) => {
  const [value, setValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const {
    handleBarcodeScan,
    setProductsModalOpen,
    setCustomerModalOpen,
    setDetailCustomer,
    currentKasa,
    setCustomerForActiveKasa,
  } = usePos();

  const selectedCustomer = currentKasa.customer;

  // Keep input focused automatically
  useEffect(() => {
    if (!isCameraOpen) {
      inputRef.current?.focus();
    }
  }, [inputRef, isCameraOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSearching) return;

    setIsSearching(true);
    const barcodeToScan = value.trim();
    setValue(''); // Immediate clear for rapid continuous barcode scanning

    await handleBarcodeScan(barcodeToScan);
    setIsSearching(false);
    
    // Ensure refocus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCameraScan = async (scannedCode: string) => {
    if (!scannedCode) return;
    await handleBarcodeScan(scannedCode);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleClear = () => {
    setValue('');
    inputRef.current?.focus();
  };

  const handleRemoveCustomer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerForActiveKasa(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {/* Barcode & Search Input */}
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <div className="relative flex items-center">
            <div className="absolute left-3 text-zeytin-700 pointer-events-none flex items-center gap-1">
              <Barcode className="w-5 h-5" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Barkod okutun veya ürün adı yazın..."
              autoComplete="off"
              autoFocus
              className="w-full pl-10 pr-20 py-2.5 bg-white border-2 border-zeytin-600 rounded-xl text-xs sm:text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zeytin-500/40 focus:border-zeytin-700 shadow-2xs transition-all h-10 sm:h-11"
            />

            <div className="absolute right-2 flex items-center space-x-1">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Temizle"
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={!value.trim() || isSearching}
                className="bg-zeytin-700 hover:bg-zeytin-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-2xs flex items-center space-x-1 cursor-pointer h-7"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Bul</span>
              </button>
            </div>
          </div>
        </form>

        {/* Camera Barcode Scanner Button */}
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold px-3 py-2 rounded-xl text-xs transition-all shadow-2xs flex items-center space-x-1.5 shrink-0 cursor-pointer h-10 sm:h-11 border border-amber-500 hover:scale-[1.01]"
          title="Kamera ile Barkod Okut"
        >
          <Camera className="w-4.5 h-4.5 text-amber-100" />
          <span className="hidden xs:inline sm:inline font-bold">Kamera</span>
        </button>

        {/* Cari Seç Butonu */}
        <button
          type="button"
          onClick={() => setCustomerModalOpen(true)}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 shrink-0 cursor-pointer h-10 sm:h-11 border ${
            selectedCustomer
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
              : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
          }`}
          title="Cari Müşteri Seç / Ekle"
        >
          {selectedCustomer ? (
            <>
              <UserCheck className="w-4 h-4 text-amber-700" />
              <span className="font-extrabold max-w-[120px] truncate">{selectedCustomer.name}</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 text-gray-500" />
              <span>Cari Seç</span>
            </>
          )}
        </button>

        {/* "ÜRÜNLER" Button (F10) */}
        <button
          type="button"
          onClick={() => setProductsModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer border border-emerald-700 hover:scale-[1.01] h-10 sm:h-11"
          title="Tüm Ürünler Kataloğunu Aç (F10)"
        >
          <LayoutGrid className="w-4 h-4 text-emerald-200" />
          <span className="tracking-wide">ÜRÜNLER</span>
          <span className="bg-emerald-950/60 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-mono">
            F10
          </span>
        </button>
      </div>

      {/* Barcode Scanner Modal Component */}
      <BarcodeScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={handleCameraScan}
      />

      {/* Selected Customer Inline Bar */}
      {selectedCustomer && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-lg px-2.5 py-1 flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-100">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-black flex items-center gap-1 text-amber-800">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              Cari: {selectedCustomer.name}
            </span>
            <span className="text-amber-400">•</span>
            <span className="text-[11px] font-bold text-amber-950">
              Mevcut Bakiye: <span className={selectedCustomer.balance > 0 ? 'text-red-700 font-black' : 'text-emerald-800 font-bold'}>
                {formatCurrency(selectedCustomer.balance)} {selectedCustomer.balance > 0 ? 'Borç' : ''}
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setDetailCustomer(selectedCustomer)}
              className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
              title="Cari Ekstre ve Fiş Geçmişi"
            >
              <History className="w-3 h-3" />
              <span>Detay / Ekstre</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomerModalOpen(true)}
              className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Değiştir
            </button>
            <button
              type="button"
              onClick={handleRemoveCustomer}
              className="p-0.5 hover:bg-amber-200 rounded text-amber-800 transition-colors cursor-pointer"
              title="Cariyi Kaldır"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
