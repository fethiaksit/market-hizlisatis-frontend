import React, { useState } from 'react';
import { Customer } from '../types/pos';
import { posService } from '../api/posService';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { showGlobalWarning } from '../utils/warningBus';
import { PlusCircle, X, Check } from 'lucide-react';

interface CustomerDebtModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

export const CustomerDebtModal: React.FC<CustomerDebtModalProps> = ({
  customer,
  onClose,
  onSaved,
}) => {
  const { refreshCustomers, showToast } = usePos();
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!customer) return null;

  const saveDebt = async () => {
    const value = typeof amount === 'number' ? amount : Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      showGlobalWarning('Borç eklenemedi: Tutar sıfırdan büyük olmalıdır.');
      return;
    }

    setIsSaving(true);
    try {
      await posService.createCustomerDebt({
        customerId: customer.id,
        amount: value,
        note: note.trim(),
      });

      await refreshCustomers();
      await onSaved();
      showToast(`Cari hesaba borç eklendi: ${formatCurrency(value)} (${customer.name})`, 'success');
      onClose();
    } catch (err: unknown) {
      showGlobalWarning(
        err instanceof Error
          ? err.message
          : 'Cari hesaba borç eklenemedi. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-amber-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-black tracking-wide">CARİ BORÇ EKLE</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-amber-800 hover:bg-amber-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="font-black text-gray-900">{customer.name}</div>
            <div className="text-xs text-gray-600 mt-1">
              Mevcut borç: <strong>{formatCurrency(customer.balance)}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase mb-1">
              Eklenecek Borç Tutarı
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0,00"
              autoFocus
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 focus:border-amber-600 rounded-xl font-black text-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase mb-1">
              Açıklama
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: Veresiye alışveriş"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 focus:border-amber-600 rounded-xl text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={saveDebt}
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:bg-gray-300 text-white font-black rounded-xl flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Kaydediliyor...' : 'Borç Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
