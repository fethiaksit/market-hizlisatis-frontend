import React, { useState, useEffect, useCallback } from 'react';
import { Customer, CustomerTransaction, CustomerTransactionType } from '../types/pos';
import { posService } from '../api/posService';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { CustomerPaymentModal } from './CustomerPaymentModal';
import { CustomerDebtModal } from './CustomerDebtModal';
import { ReceiptDetailModal } from './ReceiptDetailModal';
import { showGlobalWarning } from '../utils/warningBus';
import { 
  Users, 
  X, 
  Coins, 
  Phone,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt, 
  ChevronRight,
  UserCheck,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
}) => {
  const { setCustomerForActiveKasa, setPaymentType, setCustomerModalOpen, showToast, refreshCustomers } = usePos();

  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(customer);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(customer?.balance || 0);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState<CustomerTransactionType | 'ALL'>('ALL');

  // Sub-modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedReceiptNo, setSelectedReceiptNo] = useState<string | null>(null);

  // Keep currentCustomer updated when prop changes
  useEffect(() => {
    setCurrentCustomer(customer);
    if (customer) {
      setCurrentBalance(customer.balance);
    }
  }, [customer]);

  const refreshCustomerDetails = useCallback(async () => {
    if (!currentCustomer) return;
    try {
      const updated = await posService.getCustomerDetails(currentCustomer.id);
      setCurrentCustomer(updated);
      setCurrentBalance(updated.balance);
    } catch {
      // Keep existing currentCustomer if details fetch fails
    }
  }, [currentCustomer?.id]);

  const loadTransactions = useCallback(async () => {
    if (!currentCustomer) return;
    setLoading(true);
    try {
      const [data, balanceInfo] = await Promise.all([
        posService.getCustomerTransactions(currentCustomer.id, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          type: selectedType !== 'ALL' ? selectedType : undefined,
        }),
        posService.getCustomerBalance(currentCustomer.id).catch(() => ({ balance: currentCustomer.balance })),
      ]);
      setTransactions(data);
      if (balanceInfo && typeof balanceInfo.balance === 'number') {
        setCurrentBalance(balanceInfo.balance);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hareketler yüklenemedi.';
      showGlobalWarning(msg, 'Ekstre Yükleme Hatası');
    } finally {
      setLoading(false);
    }
  }, [currentCustomer, startDate, endDate, selectedType]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleTransactionSaved = async () => {
    await refreshCustomerDetails();
    await refreshCustomers();
    await loadTransactions();
  };

  if (!currentCustomer) return null;

  const handleSelectForSale = () => {
    setCustomerForActiveKasa(currentCustomer);
    setPaymentType('CREDIT');
    setCustomerModalOpen(false);
    showToast(`Cari satışa seçildi ve ödeme türü CARİ yapıldı: ${currentCustomer.name}`, 'success');
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
            <h2 className="text-lg sm:text-xl font-black">{currentCustomer.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zeytin-200 mt-0.5">
              {currentCustomer.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5" />
                  {currentCustomer.phone}
                </span>
              )}
              {currentCustomer.note && (
                <span className="text-gray-400">
                  • {currentCustomer.note}
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
                currentBalance > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {formatCurrency(currentBalance)} {currentBalance > 0 ? 'Borç' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setIsDebtModalOpen(true)}
                className="py-2 px-3 bg-amber-700 hover:bg-amber-600 active:bg-amber-800 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer whitespace-nowrap min-h-[36px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Borç Ekle</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer whitespace-nowrap min-h-[36px]"
              >
                <Coins className="w-4 h-4" />
                <span>Tahsilat Al</span>
              </button>

              <button
                type="button"
                onClick={handleSelectForSale}
                className="py-2 px-3 bg-zeytin-700 hover:bg-zeytin-600 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer whitespace-nowrap min-h-[36px]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Satışa Seç</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap items-center gap-2 text-xs shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-gray-500">Tür:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as CustomerTransactionType | 'ALL')}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-800 font-bold focus:outline-none focus:ring-1 focus:ring-zeytin-500 text-base sm:text-xs"
            >
              <option value="ALL">Tümü</option>
              <option value="SALE">Satış (Borç)</option>
              <option value="PAYMENT">Tahsilat (Ödeme)</option>
              <option value="DEBT">Manuel Borç</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-gray-500">Tarih:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-zeytin-500 text-base sm:text-xs"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-zeytin-500 text-base sm:text-xs"
            />
          </div>

          {(startDate || endDate || selectedType !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedType('ALL');
              }}
              className="text-xs text-zeytin-700 font-bold hover:underline cursor-pointer ml-auto"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>

        {/* Transaction History List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 sm:p-4 bg-gray-50/50">
          {loading ? (
            <div className="p-10 text-center text-gray-400 font-medium text-xs">
              Ekstre hareketleri yükleniyor...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <FileSpreadsheet className="w-10 h-10 mx-auto opacity-30 text-gray-400" />
              <p className="text-sm font-bold text-gray-600">Henüz cari hareket bulunmuyor</p>
              <p className="text-xs text-gray-400">Bu müşteriye ait borç, satış veya tahsilat kaydı bulunamadı.</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-white rounded-xl border border-gray-100 mb-2 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between gap-3"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    tx.type === 'DEBT' || tx.type === 'SALE'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {tx.type === 'DEBT' || tx.type === 'SALE' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                        tx.type === 'SALE'
                          ? 'bg-red-100 text-red-800'
                          : tx.type === 'DEBT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {tx.type === 'SALE' ? 'Satış' : tx.type === 'DEBT' ? 'Borç' : 'Tahsilat'}
                      </span>

                      {tx.receiptNo && (
                        <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          Fiş #{tx.receiptNo}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-700 font-medium mt-1 truncate">
                      {tx.note || (tx.type === 'SALE' ? 'Veresiye Satış' : tx.type === 'DEBT' ? 'Manuel Borç' : 'Cari Tahsilat')}
                    </p>

                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(tx.createdAt).toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {tx.cashierName && (
                        <span>• Kasiyer: {tx.cashierName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount, Balance After & View Details */}
                <div className="text-right shrink-0 flex items-center space-x-3">
                  <div>
                    <div className={`text-sm sm:text-base font-black ${
                      tx.type === 'DEBT' || tx.type === 'SALE' ? 'text-red-700' : 'text-emerald-700'
                    }`}>
                      {tx.type === 'DEBT' || tx.type === 'SALE'
                        ? `+${formatCurrency(tx.amount)}` 
                        : `-${formatCurrency(tx.amount)}`}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                      İşlem sonrası bakiye: <span className="font-bold text-gray-800">{formatCurrency(tx.balanceAfter)}</span>
                    </div>
                  </div>

                  {/* Fiş Detayı Butonu (Only for SALE transactions) */}
                  {(tx.receiptNo || tx.saleId) && (
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptNo(String(tx.receiptNo || tx.saleId))}
                      className="p-2 bg-gray-100 hover:bg-zeytin-100 hover:text-zeytin-900 text-gray-600 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                      title="Fiş Detayını Gör"
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
          <span>Toplam {transactions.length} cari hareket listelendi.</span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors cursor-pointer min-h-[36px]"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      <CustomerDebtModal
        customer={isDebtModalOpen ? currentCustomer : null}
        onClose={() => setIsDebtModalOpen(false)}
        onDebtSaved={handleTransactionSaved}
        onSaved={handleTransactionSaved}
      />

      <CustomerPaymentModal
        customer={isPaymentModalOpen ? currentCustomer : null}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSaved={handleTransactionSaved}
      />

      <ReceiptDetailModal
        saleIdOrReceiptNo={selectedReceiptNo}
        onClose={() => setSelectedReceiptNo(null)}
      />
    </div>
  );
};
