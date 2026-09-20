import React from 'react';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { Banknote, CreditCard, UserCheck, CheckCircle2, Loader2, UserPlus } from 'lucide-react';

interface PaymentPanelProps {
  onSaleCompleted?: () => void;
}

const QUICK_CASH_AMOUNTS = [50, 100, 200, 500];

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ onSaleCompleted }) => {
  const {
    currentKasa,
    totalAmount,
    changeAmount,
    setPaymentType,
    setReceivedAmount,
    quickAddReceivedAmount,
    completeSale,
    isSubmittingSale,
    setCustomerModalOpen,
  } = usePos();

  const isCash = currentKasa.paymentType === 'CASH';
  const isCard = currentKasa.paymentType === 'CARD';
  const isCredit = currentKasa.paymentType === 'CREDIT';
  const hasItems = currentKasa.items.length > 0;
  const selectedCustomer = currentKasa.customer;

  const handleCompleteSale = async () => {
    const success = await completeSale();
    if (success) {
      onSaleCompleted?.();
    }
  };

  const handleCashInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setReceivedAmount(isNaN(val) ? 0 : val);
  };

  const handleExactCash = () => {
    setReceivedAmount(totalAmount);
  };

  const projectedNewBalance = selectedCustomer ? selectedCustomer.balance + totalAmount : totalAmount;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-xs flex flex-col space-y-2 shrink-0">
      {/* 1. TOPLAM Tutar Banner (Always visible & distinct) */}
      <div className="bg-gradient-to-r from-gray-900 to-zeytin-950 text-white px-3.5 py-1.5 rounded-xl flex items-center justify-between shadow-inner">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
            ÖDENECEK TOPLAM TUTAR
          </span>
          <span className="text-[11px] text-zeytin-300 font-semibold">
            {currentKasa.name} {selectedCustomer ? `• ${selectedCustomer.name}` : ''}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* 2. Payment Method Toggle: NAKİT / KART / CARİ */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setPaymentType('CASH')}
          className={`py-2 px-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1 transition-all cursor-pointer border-2 ${
            isCash
              ? 'bg-zeytin-700 text-white border-zeytin-700 shadow-xs ring-2 ring-zeytin-400'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>NAKİT (F8)</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentType('CARD')}
          className={`py-2 px-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1 transition-all cursor-pointer border-2 ${
            isCard
              ? 'bg-blue-700 text-white border-blue-700 shadow-xs ring-2 ring-blue-400'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>KART (F9)</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentType('CREDIT')}
          className={`py-2 px-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1 transition-all cursor-pointer border-2 ${
            isCredit
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>CARİ (F7)</span>
        </button>
      </div>

      {/* 3. Conditional Payment Content */}
      {isCash ? (
        /* Nakit Ödeme Alanı */
        <div className="space-y-1 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between gap-1.5">
            <div className="relative flex-1">
              <input
                type="number"
                step="any"
                min="0"
                value={currentKasa.receivedAmount || ''}
                onChange={handleCashInputChange}
                placeholder="Alınan ₺"
                className="w-full bg-white border border-gray-300 focus:border-zeytin-600 rounded-lg px-2 py-1 text-right font-black text-sm text-gray-900 focus:outline-none"
              />
              <span className="absolute left-2 top-1.5 text-[10px] font-bold text-gray-400 pointer-events-none">
                Alınan
              </span>
            </div>

            <button
              type="button"
              onClick={handleExactCash}
              disabled={!hasItems}
              className="text-[11px] font-extrabold text-zeytin-800 bg-zeytin-100 hover:bg-zeytin-200 px-2 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              Tam Tutar
            </button>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              {QUICK_CASH_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => quickAddReceivedAmount(amt)}
                  className="py-0.5 px-1.5 bg-white hover:bg-zeytin-50 border border-gray-200 hover:border-zeytin-400 rounded-md text-[10px] font-black text-gray-800 transition-all cursor-pointer"
                >
                  {amt}₺
                </button>
              ))}
            </div>

            <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg px-2 py-0.5 text-right flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase">Para Üstü:</span>
              <span className="text-xs font-black text-emerald-800">
                {formatCurrency(changeAmount)}
              </span>
            </div>
          </div>
        </div>
      ) : isCard ? (
        /* Kart Ödeme Alanı */
        <div className="bg-blue-50 border border-blue-200 rounded-xl py-2 px-3 text-center flex items-center justify-center space-x-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span className="font-extrabold text-blue-900 text-xs">
            POS Terminali Hazır
          </span>
        </div>
      ) : (
        /* CARİ Ödeme Alanı */
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2">
          {!selectedCustomer ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-amber-900 text-xs font-bold">
                <span>⚠️ Cari müşteri seçilmedi!</span>
              </div>
              <button
                type="button"
                onClick={() => setCustomerModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cari Seç</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-amber-800 font-bold block">{selectedCustomer.name}</span>
                <span className="text-[10px] text-gray-500">
                  Mevcut: {formatCurrency(selectedCustomer.balance)} Borç
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">Yeni Toplam Borç:</span>
                <span className="text-xs font-black text-red-700">
                  {formatCurrency(projectedNewBalance)} Borç
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SATIŞI TAMAMLA Button */}
      <button
        type="button"
        disabled={!hasItems || isSubmittingSale}
        onClick={handleCompleteSale}
        className={`w-full py-2.5 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-[0.99] border-2 ${
          !hasItems
            ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed shadow-none'
            : isSubmittingSale
            ? 'bg-zeytin-700 border-zeytin-800 text-white opacity-80 cursor-wait'
            : isCredit && !selectedCustomer
            ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 border-amber-700 text-white'
            : 'bg-zeytin-700 hover:bg-zeytin-800 active:bg-zeytin-900 border-zeytin-800 text-white'
        }`}
      >
        {isSubmittingSale ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>İşleniyor...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 text-zeytin-200" />
            <span>SATIŞI TAMAMLA (F12)</span>
          </>
        )}
      </button>
    </div>
  );
};
