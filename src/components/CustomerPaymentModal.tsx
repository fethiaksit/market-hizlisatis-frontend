import React, { useState } from 'react';
import { Customer } from '../types/pos';
import { posService } from '../api/posService';
import { usePos } from '../context/PosContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import { Coins, X, Check, Banknote, CreditCard, AlertCircle } from 'lucide-react';

interface CustomerPaymentModalProps {
  customer: Customer | null;
  onClose: () => void;
  onPaymentSaved: () => void;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  customer,
  onClose,
  onPaymentSaved,
}) => {
  const { cashier } = useAuth();
  const { showToast, refreshCustomers, activeKasa } = usePos();

  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!customer) return null;

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setError('');
  };

  const handleFullBalance = () => {
    if (customer.balance > 0) {
      setAmount(customer.balance);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Lütfen geçerli bir tahsilat tutarı giriniz.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await posService.createCustomerPayment({
        customerId: customer.id,
        amount: numAmount,
        paymentMethod,
        note: note.trim(),
        cashierName: cashier?.name || 'Kasiyer',
        kasaId: activeKasa,
      });

      await refreshCustomers();
      showToast(`Tahsilat alındı: ${formatCurrency(numAmount)} (${customer.name})`, 'success');
      onPaymentSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tahsilat kaydedilemedi!';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const projectedBalance = typeof amount === 'number' && amount > 0 
    ? Math.max(0, customer.balance - amount)
    : customer.balance;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-black tracking-wide">
              CARİ TAHSİLAT AL
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Header Info */}
        <div className="bg-emerald-50/80 p-3.5 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <span className="font-extrabold text-gray-900 text-sm block">
              {customer.name}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {customer.phone || 'Telefon kaydı yok'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">
              Mevcut Borç:
            </span>
            <span className="text-sm font-black text-red-700">
              {formatCurrency(customer.balance)} Borç
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700 uppercase">
                Tahsil Edilen Tutar <span className="text-red-500">*</span>
              </label>
              {customer.balance > 0 && (
                <button
                  type="button"
                  onClick={handleFullBalance}
                  className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded cursor-pointer"
                >
                  Tam Borcu Kapat ({formatCurrency(customer.balance)})
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setAmount(isNaN(v) ? '' : v);
                  setError('');
                }}
                placeholder="0,00"
                autoFocus
                className="w-full pl-3 pr-8 py-2.5 bg-white border-2 border-gray-300 focus:border-emerald-600 rounded-xl text-right font-black text-xl text-gray-900 focus:outline-none"
              />
              <span className="absolute right-3 top-3 text-sm font-bold text-gray-400">
                ₺
              </span>
            </div>

            {/* Quick cash suggestions */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="py-1 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg text-xs font-black text-gray-700 transition-colors cursor-pointer"
                >
                  {val} ₺
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Toggle: NAKİT / KART */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Tahsilat Türü
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border-2 ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>NAKİT TAHSİLAT</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border-2 ${
                  paymentMethod === 'CARD'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>KART TAHSİLAT</span>
              </button>
            </div>
          </div>

          {/* Note input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Açıklama / Makbuz Notu (Opsiyonel)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: Elden nakit teslim alındı"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-gray-900 focus:outline-none"
            />
          </div>

          {/* Balance Preview */}
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
            <span className="font-bold text-gray-600">İşlem Sonrası Yeni Bakiye:</span>
            <span className="font-black text-emerald-800 text-sm">
              {formatCurrency(projectedBalance)} {projectedBalance > 0 ? 'Borç' : ''}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Kaydediliyor...' : 'Tahsilatı Onayla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
