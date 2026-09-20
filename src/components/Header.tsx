import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePos } from '../context/PosContext';
import { PosAudio } from '../utils/format';
import { 
  ShoppingBag, 
  LogOut, 
  Volume2, 
  VolumeX, 
  User, 
  Settings2,
  ShieldAlert
} from 'lucide-react';

export const Header: React.FC = () => {
  const { cashier, logout } = useAuth();
  const { hasAnyOpenBaskets, setLogoutConfirmOpen, setApiSettingsOpen } = usePos();
  const [soundEnabled, setSoundEnabled] = useState(PosAudio.isSoundEnabled());

  const handleLogoutClick = () => {
    if (hasAnyOpenBaskets()) {
      setLogoutConfirmOpen(true);
    } else {
      logout();
    }
  };

  const toggleSound = () => {
    const newState = PosAudio.toggleSound();
    setSoundEnabled(newState);
  };

  return (
    <header className="bg-zeytin-900 text-white px-4 py-1.5 flex items-center justify-between shadow-xs select-none shrink-0 h-11 border-b border-zeytin-950">
      {/* Brand & Store Name */}
      <div className="flex items-center space-x-2.5">
        <div className="bg-zeytin-600 p-1.5 rounded-lg flex items-center justify-center shadow-inner">
          <ShoppingBag className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-baseline space-x-2">
          <h1 className="text-base font-black tracking-wide leading-none text-white">
            ZEYTİN MARKET
          </h1>
          <span className="text-[10px] font-bold text-zeytin-300 tracking-wider hidden sm:inline">
            HIZLI SATIŞ POS
          </span>
        </div>
      </div>

      {/* Right Controls: Cashier info & Actions */}
      <div className="flex items-center space-x-2">
        {/* Sound toggle */}
        <button
          type="button"
          onClick={toggleSound}
          title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          className={`p-1.5 rounded-lg transition-colors text-xs flex items-center cursor-pointer ${
            soundEnabled 
              ? 'bg-zeytin-800 hover:bg-zeytin-700 text-zeytin-100' 
              : 'bg-red-900/80 hover:bg-red-900 text-red-200'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* API Settings */}
        <button
          type="button"
          onClick={() => setApiSettingsOpen(true)}
          title="Bağlantı & API Ayarları"
          className="p-1.5 rounded-lg bg-zeytin-800 hover:bg-zeytin-700 text-zeytin-100 transition-colors cursor-pointer"
        >
          <Settings2 className="w-4 h-4" />
        </button>

        {/* Manager Panel Button */}
        {cashier?.role === 'admin' && (
          <button
            type="button"
            onClick={useAuth().goToAdmin}
            className="flex items-center space-x-1.5 bg-amber-600/90 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs border border-amber-500/50"
            title="Yönetici Paneline Geç"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yönetici Paneli</span>
          </button>
        )}

        {/* Cashier Badge */}
        <div className="flex items-center space-x-1.5 bg-zeytin-950/80 border border-zeytin-800 px-2.5 py-1 rounded-lg">
          <User className="w-3.5 h-3.5 text-zeytin-400" />
          <span className="text-xs font-bold text-white">
            {cashier?.name || 'Kasiyer'}
          </span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="flex items-center space-x-1 bg-red-600/90 hover:bg-red-600 active:bg-red-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
          title="Kasiyer Oturumunu Kapat"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Çıkış</span>
        </button>
      </div>
    </header>
  );
};
