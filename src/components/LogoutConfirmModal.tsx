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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-9 h-9" />
        </div>

        <div>
          <h3 className="text-xl font-black text-gray-900">
            Açık Sepetler Bulunuyor!
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Aşağıdaki kasalarda henüz tamamlanmamış satışlar var:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {openKasas.map(k => (
              <span key={k.id} className="bg-amber-100 text-amber-800 font-extrabold text-xs px-3 py-1 rounded-full">
                {k.name} ({k.items.length} ürün)
              </span>
            ))}
          </div>
          <p className="text-xs text-red-600 font-semibold mt-3">
            Oturumu kapatmak istediğinize emin misiniz?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(false)}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Vazgeç</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmLogout}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Yine de Çık</span>
          </button>
        </div>
      </div>
    </div>
  );
};
