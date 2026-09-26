import React from 'react';
import { usePos } from '../context/PosContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = usePos();

  if (!toast) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-1rem)] sm:w-auto sm:min-w-[320px] sm:max-w-[560px] animate-in slide-in-from-top-3 fade-in duration-150 pointer-events-none">
      <div
        className={`pointer-events-auto px-3.5 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : toast.type === 'error'
            ? 'bg-red-50 border-red-300 text-red-950'
            : 'bg-slate-50 border-slate-300 text-slate-900'
        }`}
        role="status"
        aria-live="polite"
      >
        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}

        <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">
          {toast.message || 'Bilgi güncellendi.'}
        </span>

        <button
          type="button"
          onClick={dismissToast}
          className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center shrink-0 cursor-pointer"
          title="Bildirimi kapat"
          aria-label="Bildirimi kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
