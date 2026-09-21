import React from 'react';
import { usePos } from '../context/PosContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast } = usePos();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className={`px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border ${
        toast.type === 'success'
          ? 'bg-zeytin-900 border-zeytin-500 text-white'
          : toast.type === 'error'
          ? 'bg-red-900 border-red-500 text-white'
          : 'bg-gray-900 border-gray-600 text-white'
      }`}>
        {toast.type === 'success' && <CheckCircle className="w-6 h-6 text-zeytin-400 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />}
        {toast.type === 'info' && <Info className="w-6 h-6 text-blue-400 shrink-0" />}

        <span className="font-bold text-sm tracking-wide">
          {toast.type === 'error' ? `Uyarı: ${toast.message || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'}` : (toast.message || 'Bilgi güncellendi.')}
        </span>
      </div>
    </div>
  );
};
