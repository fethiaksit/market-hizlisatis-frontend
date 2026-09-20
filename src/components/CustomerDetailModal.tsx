import React, { useState, useEffect, useCallback } from 'react';
import { Customer, CustomerTransaction, CustomerTransactionType } from '../types/pos';
import { posService } from '../api/posService';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { CustomerPaymentModal } from './CustomerPaymentModal';
import { ReceiptDetailModal } from './ReceiptDetailModal';
import { 
  Users, 
  X, 
  Phone, 
  Calendar, 
  Filter, 
  ShoppingBag, 
  Coins, 
  RotateCcw, 
  Receipt, 
  UserCheck, 
  Loader2,
  ChevronRight
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
}) => {
  const { setCustomerForActiveKasa, showToast } = usePos();
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState<CustomerTransactionType | 'ALL'>('ALL');

  // Sub-modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceiptNo, setSelectedReceiptNo] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const data = await posService.getCustomerTransactions(customer.id, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type: selectedType !== 'ALL' ? selectedType : undefined,
      });
      setTransactions(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [customer, startDate, endDate, selectedType]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  if (!customer) return null;

  const handleSelectForSale = () => {
    setCustomerForActiveKasa(customer);
    showToast(`Cari satışa seçildi: ${customer.name}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-zeytin-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-zeytin-900">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-zeytin-400" />
            <h3 className="text-base font-black tracking-wide">
              CARİ DETAY & HESAP EKSTRESİ
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zeytin-900 hover:bg-zeytin-800 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile & Balance Overview */}
        <div className="bg-gradient-to-r from-gray-900 to-zeytin-950 text-white p-4 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div>
            <h2 className="text-lg sm:text-xl font-black">{customer.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zeytin-200 mt-0.5">
              {customer.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.phone}
                </span>
              )}
              {customer.note && (
                <span className="text-gray-400">
                  • {customer.note}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                GÜNCEL BAKİYE
              </span>
              <span className={`text-xl font-black ${
                customer.balance > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {formatCurrency(customer.balance)} {customer.balance > 0 ? 'Borç' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Coins className="w-4 h-4" />
                <span>Tahsilat Al</span>
              </button>

              <button
                type="button"
                onClick={handleSelectForSale}
                className="py-2 px-3 bg-zeytin-700 hover:bg-zeytin-600 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <UserCheck className="w-4 h-4" />
                <span>Satışa Seç</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Type Filter Tabs */}
          <div className="flex items-center space-x-1">
            <span className="text-gray-400 mr-1 flex items-center gap-1 font-bold">
              <Filter className="w-3 h-3" />
              <span>Tür:</span>
            </span>
            {[
              { id: 'ALL', label: 'Tümü' },
              { id: 'SALE', label: 'Alışveriş' },
              { id: 'PAYMENT', label: 'Tahsilat' },
              { id: 'RETURN', label: 'İade' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id as CustomerTransactionType | 'ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-zeytin-700 text-white shadow-2xs'
                    : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-zeytin-600"
              title="Başlangıç Tarihi"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-zeytin-600"
              title="Bitiş Tarihi"
            />
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 p-3 space-y-2">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-zeytin-700" />
              <span className="text-xs font-bold">Hareketler yükleniyor...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="font-bold text-gray-600">Bu kritere uygun hareket bulunamadı.</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white hover:bg-gray-50/90 border border-gray-200 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors shadow-2xs"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'SALE'
                      ? 'bg-amber-100 text-amber-700'
                      : tx.type === 'PAYMENT'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tx.type === 'SALE' && <ShoppingBag className="w-5 h-5" />}
                    {tx.type === 'PAYMENT' && <Coins className="w-5 h-5" />}
                    {tx.type === 'RETURN' && <RotateCcw className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.2 rounded font-extrabold text-[10px] ${
                        tx.type === 'SALE'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : tx.type === 'PAYMENT'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}>
                        {tx.type === 'SALE' ? 'ALIŞVERİŞ' : tx.type === 'PAYMENT' ? 'CARİ TAHSİLAT' : 'İADE'}
                      </span>

                      <span className="text-xs font-bold text-gray-500">
                        {tx.date} • {tx.time}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-2">
                      {tx.receiptNo && (
                        <span className="font-mono font-bold text-gray-900">
                          {tx.receiptNo}
                        </span>
                      )}
                      {tx.kasaId && (
                        <span>• Kasa {tx.kasaId}</span>
                      )}
                      {tx.cashierName && (
                        <span className="text-gray-500">• {tx.cashierName}</span>
                      )}
                      {tx.paymentMethod && (
                        <span className="text-gray-500 font-mono text-[10px] bg-gray-100 px-1.5 py-0.2 rounded">
                          {tx.paymentMethod === 'CASH' ? 'Nakit' : tx.paymentMethod === 'CARD' ? 'Kart' : 'Cari'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount, Balance After & View Details */}
                <div className="text-right shrink-0 flex items-center space-x-3">
                  <div>
                    <div className={`text-sm sm:text-base font-black ${
                      tx.amount > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}>
                      {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                      Bakiye sonrası: <span className="font-bold text-gray-800">{formatCurrency(tx.balanceAfter)}</span>
                    </div>
                  </div>

                  {/* Fiş Detayı Butonu (Only for SALE transactions) */}
                  {tx.receiptNo && (
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptNo(tx.receiptNo || null)}
                      className="p-2 bg-gray-100 hover:bg-zeytin-100 hover:text-zeytin-900 text-gray-600 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                      title="Fiş ve Ürün Detayını Gör"
                    >
                      <Receipt className="w-4 h-4" />
                      <span className="text-xs font-bold hidden sm:inline">Detay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Toplam {transactions.length} hareket listelendi.</span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      <CustomerPaymentModal
        customer={isPaymentModalOpen ? customer : null}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSaved={loadTransactions}
      />

      <ReceiptDetailModal
        saleIdOrReceiptNo={selectedReceiptNo}
        onClose={() => setSelectedReceiptNo(null)}
      />
    </div>
  );
};
