import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowRight, Delete } from 'lucide-react';
import { PosAudio } from '../utils/format';

export const LoginView: React.FC = () => {
  const { loginWithPin } = useAuth();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          setPin(prev => prev + e.key);
          setError('');
          PosAudio.playScanBeep();
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
        setError('');
        PosAudio.playScanBeep();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) {
          submitPin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const submitPin = async (submittedPin: string) => {
    if (submittedPin.length < 4) {
      setError('Lütfen 4 haneli PIN kodunu girin.');
      PosAudio.playErrorTone();
      return;
    }

    const { success, message } = await loginWithPin(submittedPin);
    if (!success) {
      setError(message || 'Giriş yapılamadı.');
      setPin('');
      PosAudio.playErrorTone();
    } else {
      PosAudio.playSuccessChime();
    }
  };

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
      PosAudio.playScanBeep();
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
    PosAudio.playScanBeep();
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
    PosAudio.playScanBeep();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPin(pin);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-zeytin-800 to-zeytin-950 flex flex-col justify-center items-center p-4 font-sans select-none overflow-hidden relative">
      {/* Brand & Store Name */}
      <div className="absolute top-6 left-0 right-0 flex justify-center items-center px-6">
        <div className="flex items-center space-x-3">
          <div className="bg-zeytin-600 p-2.5 rounded-xl shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wide text-white">
              ZEYTİN MARKET
            </h1>
            <p className="text-xs text-zeytin-300 font-medium">
              Sistem Girişi
            </p>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 mt-12">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-zeytin-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">Sisteme Giriş</h2>
          <p className="text-xs text-zeytin-200">
            Devam etmek için PIN kodunuzu girin
          </p>
        </div>

        {/* PIN Dots display */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center items-center space-x-3 h-12 bg-black/30 rounded-2xl border border-white/15 px-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all ${
                  idx < pin.length
                    ? 'bg-zeytin-400 scale-125 shadow-md shadow-zeytin-400/50'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 font-bold text-center animate-shake">
              {error}
            </p>
          )}

          {/* Touch Numpad */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumClick(num)}
                className="h-14 bg-white/10 hover:bg-white/25 active:bg-white/40 border border-white/10 rounded-2xl text-2xl font-black text-white transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-14 bg-red-950/40 hover:bg-red-900/50 active:bg-red-800/60 border border-red-500/20 rounded-2xl text-xs font-black text-red-200 transition-all cursor-pointer active:scale-95 flex items-center justify-center uppercase"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={() => handleNumClick('0')}
              className="h-14 bg-white/10 hover:bg-white/25 active:bg-white/40 border border-white/10 rounded-2xl text-2xl font-black text-white transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 bg-white/10 hover:bg-white/25 active:bg-white/40 border border-white/10 rounded-2xl text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Sil"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-zeytin-600 hover:bg-zeytin-500 active:bg-zeytin-700 text-white font-black text-lg rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2 border border-zeytin-400"
          >
            <span>GİRİŞ YAP</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-1">
        <span>ZeytinERP v2.4 • Hızlı Satış & Yönetim POS</span>
        <span className="text-zeytin-300">Kasiyer: 1234 • Yönetici: 9999</span>
      </div>
    </div>
  );
};
