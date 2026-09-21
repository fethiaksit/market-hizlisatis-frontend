import React, { useState, useMemo } from 'react';
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

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  }, [customers, searchQuery]);

  if (!isCustomerModalOpen) return null;

  const handleSelect = (customer: Customer) => {
    setCustomerForActiveKasa(customer);
    setPaymentType('CREDIT');
    showToast(`Cari seçildi ve ödeme türü CARİ yapıldı: ${customer.name}`, 'info');
    setCustomerModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white w-full max-w-xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-150">
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
              onClick={() => {
                setCustomerModalOpen(false);
              }}
              className="p-1.5 rounded-lg bg-zeytin-800 hover:bg-zeytin-700 text-white transition-colors cursor-pointer"
              title="Kapat (Esc)"
            >
              <X className="w-5 h-5" />
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
