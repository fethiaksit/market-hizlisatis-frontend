import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';

const FEATURES = [
  'Barkod ile ürün ekleme',
  'Ürün arama',
  'Cari müşteri seçimi',
  'Nakit / Kart işlemleri',
  'Stok takibi',
  'Gün sonu işlemleri',
  'ZeytinERP ile senkronizasyon',
];

export const AppInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Uygulama hakkında"
        title="Uygulama hakkında"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-xs transition-colors hover:border-gray-300 hover:text-zeytin-700 focus:outline-none focus:ring-2 focus:ring-zeytin-500/30"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-info-title"
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zeytin-600">
                  Uygulama hakkında
                </p>
                <h2 id="app-info-title" className="mt-1 text-lg font-black text-gray-900">
                  ZeytinERP Hızlı Satış
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Kapat"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-zeytin-500/30"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4 text-sm text-gray-600">
              <p>
                Market satış işlemlerini hızlı ve kolay şekilde yönetmek için hazırlanmıştır.
              </p>

              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zeytin-600" />
                    {feature}
                  </li>
                ))}
              </ul>

            </div>

            <div className="flex items-center justify-between rounded-b-2xl bg-gray-50 px-5 py-2.5 text-[10px] text-gray-400">
              <span>USB barkod okuyucu desteklenir.</span>
              <span className="font-mono font-bold text-zeytin-700">v1.0.0</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
};
