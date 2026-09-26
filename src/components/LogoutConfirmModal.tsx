import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePos } from '../context/PosContext';
import { AlertTriangle, LogOut, X } from 'lucide-react';

export const LogoutConfirmModal: React.FC = () => {
  const { logout } = useAuth();
  const { isLogoutConfirmOpen, setLogoutConfirmOpen, kasas } = usePos();

  if (!isLogoutConfirmOpen) return null;

  const openKasas = Object.values(kasas).filter(k => k.items && k.items.length > 0);

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-warning-title"
      >
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 id="logout-warning-title" className="text-lg font-black text-gray-900">Uyarı</h3>
            <p className="text-[11px] text-gray-500 font-semibold">Açık sepetler bulunuyor</p>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm font-bold text-gray-800 leading-relaxed">
            Tamamlanmamış satışlar var. Çıkış yaparsanız açık sepetler kaybolabilir.
          </p>

          {openKasas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {openKasas.map(k => (
                <span
                  key={k.id}
                  className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1.5 rounded-full"
                >
                  {k.name}: {k.items.length} ürün
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(false)}
            className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-black rounded-xl text-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Yine de Çık
          </button>
        </div>
      </div>
    </div>
  );
};
