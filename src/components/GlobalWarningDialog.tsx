import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { GLOBAL_WARNING_EVENT, GlobalWarningDetail } from '../utils/warningBus';

export const GlobalWarningDialog: React.FC = () => {
  const [warning, setWarning] = useState<GlobalWarningDetail | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<GlobalWarningDetail>;
      const message = String(customEvent.detail?.message || '').trim();

      setWarning({
        title: customEvent.detail?.title || 'Uyarı',
        message: message || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
      });

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        setWarning(null);
        timerRef.current = null;
      }, 5000);
    };

    window.addEventListener(GLOBAL_WARNING_EVENT, handler as EventListener);

    return () => {
      window.removeEventListener(GLOBAL_WARNING_EVENT, handler as EventListener);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!warning) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[220] w-[calc(100%-1rem)] sm:w-auto sm:min-w-[360px] sm:max-w-[620px] animate-in slide-in-from-top-3 fade-in duration-150 pointer-events-none">
      <div
        className="pointer-events-auto bg-amber-50 border-2 border-amber-300 rounded-xl shadow-xl px-3.5 py-2.5 flex items-start gap-2.5"
        role="alert"
        aria-live="assertive"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-black text-amber-950">
            {warning.title || 'Uyarı'}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-amber-900 mt-0.5 leading-snug">
            {warning.message}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setWarning(null)}
          className="w-8 h-8 rounded-lg hover:bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 cursor-pointer"
          title="Uyarıyı kapat"
          aria-label="Uyarıyı kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
