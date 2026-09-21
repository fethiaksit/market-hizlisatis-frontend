import React from 'react';
import { usePos } from '../context/PosContext';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = usePos();

  if (!toast) return null;

  if (toast.type === 'error') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="pos-warning-title"
        >
          <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 id="pos-warning-title" className="text-base font-black text-gray-900">
                Uyarı
              </h3>
              <p className="text-[11px] text-gray-500 font-semibold">
                İşlemi kontrol edin
              </p>
            </div>
          </div>

          <div className="px-5 py-5">
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              {toast.message || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'}
            </p>
          </div>

          <div className="px-5 pb-5 flex justify-end">
            <button
              type="button"
              onClick={dismissToast}
              autoFocus
              className="min-w-28 px-5 py-2.5 bg-zeytin-700 hover:bg-zeytin-800 text-white font-black rounded-xl text-sm cursor-pointer"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] animate-in slide-in-from-bottom-5 duration-200">
      <div className={`px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border ${
        toast.type === 'success'
          ? 'bg-zeytin-900 border-zeytin-500 text-white'
          : 'bg-gray-900 border-gray-600 text-white'
      }`}>
        {toast.type === 'success' ? (
          <CheckCircle className="w-6 h-6 text-zeytin-400 shrink-0" />
        ) : (
          <Info className="w-6 h-6 text-blue-400 shrink-0" />
        )}
        <span className="font-bold text-sm tracking-wide">
          {toast.message || 'Bilgi güncellendi.'}
        </span>
      </div>
    </div>
  );
};
