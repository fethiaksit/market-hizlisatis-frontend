import React, { useState, useEffect } from 'react';
import { warningBus, WarningEvent } from '../utils/warningBus';
import { AlertTriangle, X } from 'lucide-react';

export const GlobalWarningDialog: React.FC = () => {
  const [warning, setWarning] = useState<WarningEvent | null>(null);

  useEffect(() => {
    const unsubscribe = warningBus.subscribe((event) => {
      setWarning(event);
    });
    return unsubscribe;
  }, []);

  if (!warning) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-amber-100 flex flex-col">
        {/* Header */}
        <div className="bg-amber-600 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-200" />
            <h3 className="text-base font-black tracking-wide">
              {warning.title || 'Uyarı'}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setWarning(null)}
            className="p-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-sm font-bold text-gray-800 leading-relaxed">
            {warning.message}
          </p>

          {warning.details && (
            <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2.5 rounded-xl border border-gray-200 break-words">
              {warning.details}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => setWarning(null)}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
