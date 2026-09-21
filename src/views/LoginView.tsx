import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { PosAudio } from '../utils/format';
import { showGlobalWarning } from '../utils/warningBus';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usernameOrPhone.trim()) {
      showGlobalWarning('Lütfen kullanıcı adı veya telefon numaranızı girin.');
      PosAudio.playErrorTone();
      return;
    }

    if (!password) {
      showGlobalWarning('Lütfen şifrenizi girin.');
      PosAudio.playErrorTone();
      return;
    }

    setIsLoading(true);
    try {
      const { success, message } = await login(usernameOrPhone.trim(), password);
      if (!success) {
        showGlobalWarning(message || 'Giriş yapılamadı. Kullanıcı adı veya şifre hatalı.');
        PosAudio.playErrorTone();
      } else {
        PosAudio.playSuccessChime();
      }
    } catch {
      showGlobalWarning('Bağlantı kurulamadı. Lütfen tekrar deneyin.');
      PosAudio.playErrorTone();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-zeytin-900 via-zeytin-950 to-black flex flex-col justify-center items-center p-4 font-sans select-none overflow-hidden relative">
      {/* Top Header Logo */}
      <div className="absolute top-6 left-0 right-0 flex justify-center items-center px-6">
        <div className="flex items-center space-x-3">
          <div className="bg-zeytin-600 p-2.5 rounded-xl shadow-lg border border-zeytin-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wide text-white">
              ZEYTİN MARKET
            </h1>
            <p className="text-xs text-zeytin-300 font-medium">
              Hızlı Satış & Otomasyon Sistemi
            </p>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 mt-8">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-zeytin-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3 border border-zeytin-400/30">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">Personel Girişi</h2>
          <p className="text-xs text-zeytin-200">
            Devam etmek için kullanıcı bilgilerinizi giriniz
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Phone Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zeytin-200 block">
              Kullanıcı Adı veya Telefon
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zeytin-300">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={usernameOrPhone}
                onChange={(e) => {
                  setUsernameOrPhone(e.target.value);
                  setError('');
                }}
                placeholder="Örn: admin veya 05XXXXXXXXX"
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3.5 bg-black/30 text-white border border-white/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zeytin-400 focus:border-transparent text-sm transition-all placeholder:text-gray-400"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zeytin-200 block">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zeytin-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3.5 bg-black/30 text-white border border-white/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zeytin-400 focus:border-transparent text-sm transition-all placeholder:text-gray-400"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-center">
              <p className="text-xs text-red-300 font-bold">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-zeytin-600 hover:bg-zeytin-500 active:bg-zeytin-700 text-white font-black text-base rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2 border border-zeytin-400/30 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="text-sm">Giriş Yapılıyor...</span>
            ) : (
              <>
                <span>GİRİŞ YAP</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-1">
        <span>ZeytinERP v2.4 • Hızlı Satış & Yönetim POS</span>
        <span className="text-zeytin-400 text-[11px]">Sisteme sadece yetkili personeller giriş yapabilir.</span>
      </div>
    </div>
  );
};
