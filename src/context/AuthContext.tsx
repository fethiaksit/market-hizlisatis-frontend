import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cashier } from '../types/pos';
import { posService } from '../api/posService';

interface AuthContextType {
  cashier: Cashier | null;
  activeView: 'LOGIN' | 'POS' | 'EOD' | 'ADMIN';
  loginWithPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  goToEod: () => void;
  goToLogin: () => void;
  goToAdmin: () => void;
  goToPos: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_AUTH_KEY = 'zeytin_pos_active_cashier';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cashier, setCashier] = useState<Cashier | null>(() => {
    const saved = localStorage.getItem(STORAGE_AUTH_KEY);
    const token = localStorage.getItem('zeytin_pos_token');
    if (!saved || !token) {
      localStorage.removeItem(STORAGE_AUTH_KEY);
      return null;
    }
    return JSON.parse(saved);
  });
  const [activeView, setActiveView] = useState<'LOGIN' | 'POS' | 'EOD' | 'ADMIN'>(() => {
    const saved = localStorage.getItem(STORAGE_AUTH_KEY);
    const token = localStorage.getItem('zeytin_pos_token');
    if (!saved || !token) return 'LOGIN';
    const c = JSON.parse(saved) as Cashier;
    return c.role === 'admin' ? 'ADMIN' : 'POS';
  });

  useEffect(() => {
    if (cashier) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(cashier));
      setActiveView(cashier.role === 'admin' ? 'ADMIN' : 'POS');
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
      if (activeView !== 'LOGIN') {
        setActiveView('LOGIN');
      }
    }
  }, [cashier]);

  const loginWithPin = async (pin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const foundCashier = await posService.loginWithPin(pin);
      if (foundCashier) {
        setCashier(foundCashier);
        setActiveView(foundCashier.role === 'admin' ? 'ADMIN' : 'POS');
        return { success: true };
      }
      return { success: false, message: 'Hatalı PIN Kodu! Lütfen kontrol ediniz.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş yapılamadı.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('zeytin_pos_token');
    setCashier(null);
    setActiveView('LOGIN');
  };

  const goToEod = () => setActiveView('EOD');
  const goToLogin = () => setActiveView('LOGIN');
  const goToAdmin = () => setActiveView('ADMIN');
  const goToPos = () => setActiveView('POS');

  return (
    <AuthContext.Provider value={{ cashier, activeView, loginWithPin, logout, goToEod, goToLogin, goToAdmin, goToPos }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
