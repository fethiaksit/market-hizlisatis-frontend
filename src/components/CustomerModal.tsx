import React, { useState, useMemo, useEffect } from 'react';
import { usePos } from '../context/PosContext';
import { Customer } from '../types/pos';
import { formatCurrency } from '../utils/format';
import { CustomerDetailModal } from './CustomerDetailModal';
import { Search, X, Users, Phone, History, CheckCircle2 } from 'lucide-react';

export const CustomerModal: React.FC = () => {
  const {
    isCustomerModalOpen,
    setCustomerModalOpen,
    customers,
    setCustomerForActiveKasa,
    setPaymentType,
    showToast,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const normalizeText = (value: unknown) =>
    String(value ?? '')
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .trim();

  const normalizePhone = (value: unknown) =>
    String(value ?? '').replace(/\D/g, '');

  const filteredCustomers = useMemo(() => {
    const textQuery = normalizeText(searchQuery);
    const phoneQuery = normalizePhone(searchQuery);

    if (!textQuery && !phoneQuery) return customers;

    return customers.filter((customer) => {
      const name = normalizeText(customer.name);
      const phone = normalizePhone(customer.phone);
      const note = normalizeText(customer.note);

      const textMatch =
        !!textQuery &&
        (name.includes(textQuery) || note.includes(textQuery));

      const phoneMatch =
        !!phoneQuery &&
        phone.includes(phoneQuery);

      return textMatch || phoneMatch;
    });
  }, [customers, searchQuery]);

  const closeModal = () => {
    setDetailCustomer(null);
    setSearchQuery('');
    setCustomerModalOpen(false);
  };

  useEffect(() => {
    if (!isCustomerModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (detailCustomer) {
          setDetailCustomer(null);
        } else {
          closeModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomerModalOpen, detailCustomer]);

  if (!isCustomerModalOpen) return null;

  const handleSelect = (customer: Customer) => {
    setCustomerForActiveKasa(customer);
    setPaymentType('CREDIT');
    showToast(`Cari seçildi ve ödeme türü CARİ yapıldı: ${customer.name}`, 'info');
    setCustomerModalOpen(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div
          className="bg-white w-full sm:max-w-xl h-[88vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-150"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-zeytin-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-zeytin-300" />
              <h3 className="text-base font-black tracking-wide">
                CARİ MÜŞTERİ SEÇİMİ
              </h3>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="min-w-10 min-h-10 p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Kapat (Esc)"
              aria-label="Cari seçim ekranını kapat"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 min-h-0 flex flex-col p-3.5 space-y-3 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İsim veya telefon ile cari arayın..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 focus:border-zeytin-600 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-bold text-gray-600">Kayıtlı cari bulunamadı</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Cari müşteri tanımları sadece Yönetici Paneli üzerinden yapılabilir.
                  </p>
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className="p-2.5 hover:bg-gray-50/90 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-gray-900 group-hover:text-zeytin-900 text-xs sm:text-sm leading-tight truncate">
                        {cust.name}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                        {cust.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {cust.phone}
                          </span>
                        )}
                        {cust.note && (
                          <span className="text-gray-400 truncate max-w-[130px]">
                            • {cust.note}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Balance Info */}
                    <div className="text-right shrink-0">
                      <span className={`text-xs sm:text-sm font-black block ${
                        cust.balance > 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        {formatCurrency(cust.balance)}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {cust.balance > 0 ? 'Borç Bakiyesi' : 'Bakiye Sıfır'}
                      </span>
                    </div>

                    {/* Actions: Detay & Satışa Seç */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailCustomer(cust)}
                        className="p-1.5 bg-gray-100 hover:bg-zeytin-100 hover:text-zeytin-900 text-gray-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                        title="Cari Detay & Hareketler"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelect(cust)}
                        className="py-1.5 px-2.5 bg-zeytin-700 hover:bg-zeytin-800 text-white rounded-lg text-xs font-black transition-colors cursor-pointer shadow-2xs flex items-center space-x-1"
                        title="Bu cariyi aktif satışa seç"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Seç</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Always-visible footer actions */}
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-3.5 py-3 flex items-center justify-between gap-3">
            <span className="hidden sm:block text-[11px] text-gray-500 font-medium">
              ESC veya dış alana tıklayarak çıkabilirsiniz.
            </span>
            <button
              type="button"
              onClick={closeModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-sm font-black transition-colors cursor-pointer"
            >
              Vazgeç / Kapat
            </button>
          </div>
        </div>
      </div>

      {/* Customer Detail & Statement Modal */}
      {detailCustomer && (
        <CustomerDetailModal
          customer={detailCustomer}
          onClose={() => setDetailCustomer(null)}
        />
      )}
    </>
  );
};
