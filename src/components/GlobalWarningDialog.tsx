import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GLOBAL_WARNING_EVENT, GlobalWarningDetail } from '../utils/warningBus';

export const GlobalWarningDialog: React.FC = () => {
  const [warning, setWarning] = useState<GlobalWarningDetail | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<GlobalWarningDetail>;
      const message = String(customEvent.detail?.message || '').trim();
      setWarning({
        title: customEvent.detail?.title || 'Uyarı',
        message: message || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
      });
    };

    window.addEventListener(GLOBAL_WARNING_EVENT, handler as EventListener);
    return () => window.removeEventListener(GLOBAL_WARNING_EVENT, handler as EventListener);
  }, []);

  if (!warning) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="global-warning-title"
      >
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 id="global-warning-title" className="text-lg font-black text-gray-900">
              {warning.title || 'Uyarı'}
            </h3>
            <p className="text-[11px] text-gray-500 font-semibold">Lütfen işlemi kontrol edin</p>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm font-bold text-gray-800 leading-relaxed">
            {warning.message}
          </p>
        </div>

        <div className="px-5 pb-5 flex justify-end">
          <button
            type="button"
            onClick={() => setWarning(null)}
            autoFocus
            className="min-w-28 px-5 py-2.5 bg-zeytin-700 hover:bg-zeytin-800 text-white font-black rounded-xl text-sm cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
