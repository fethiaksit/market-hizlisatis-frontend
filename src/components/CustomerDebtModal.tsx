import React, { useState } from 'react';
import { Customer } from '../types/pos';
import { posService } from '../api/posService';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { showGlobalWarning } from '../utils/warningBus';
import { ShoppingBag, X, Check, AlertCircle } from 'lucide-react';

interface CustomerDebtModalProps {
  customer: Customer | null;
  onClose: () => void;
  onDebtSaved?: () => void;
  onSaved?: () => void;
}

export const CustomerDebtModal: React.FC<CustomerDebtModalProps> = ({
  customer,
  onClose,
  onDebtSaved,
  onSaved,
}) => {
  const { showToast, refreshCustomers } = usePos();

  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!customer) return null;

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      const msg = 'Lütfen sıfırdan büyük geçerli bir borç tutarı giriniz.';
      setError(msg);
      showGlobalWarning(msg);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await posService.createCustomerDebt({
        customerId: customer.id,
        amount: numAmount,
        note: note.trim() || 'Manuel Borç Ekleme',
      });

      await refreshCustomers();
      showToast(`Cari hesaba borç eklendi: ${formatCurrency(numAmount)} (${customer.name})`, 'success');
      onDebtSaved?.();
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Borç eklenemedi!';
      showGlobalWarning(msg, 'Borç Eklenemedi');
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const projectedBalance = typeof amount === 'number' && amount > 0 
    ? customer.balance + amount
    : customer.balance;

  return (
    <div className="fixed inset-0 z-[160] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-amber-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-black tracking-wide">
              CARİ BORÇ EKLE
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Info Header */}
        <div className="bg-amber-50/80 p-3.5 border-b border-amber-100 flex items-center justify-between">
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
              {formatCurrency(customer.balance)}
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
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Eklenen Borç Tutarı <span className="text-red-500">*</span>
            </label>

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
                className="w-full pl-3 pr-8 py-2.5 bg-white border-2 border-gray-300 focus:border-amber-600 rounded-xl text-right font-black text-xl text-gray-900 focus:outline-none"
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
                  className="py-1 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-lg text-xs font-black text-gray-700 transition-colors cursor-pointer"
                >
                  +{val} ₺
                </button>
              ))}
            </div>
          </div>

          {/* Note input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Açıklama / Borç Sebebi
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: Veresiye market alışverişi"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-amber-600 focus:bg-white rounded-xl text-base sm:text-xs text-gray-900 focus:outline-none"
            />
          </div>

          {/* Balance Preview */}
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
            <span className="font-bold text-gray-600">İşlem Sonrası Yeni Bakiye:</span>
            <span className="font-black text-red-700 text-sm">
              {formatCurrency(projectedBalance)} Borç
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer min-h-[40px]"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:bg-gray-300 text-white font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center space-x-1.5 min-h-[40px]"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Kaydediliyor...' : 'Borcu Onayla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
