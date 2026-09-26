import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cashier } from '../types/pos';

import { posService } from '../api/posService';
import { getTurkishWarning } from '../api/apiClient';

interface AuthContextType {
  cashier: Cashier | null;
  activeView: 'LOGIN' | 'POS' | 'EOD' | 'ADMIN';
  login: (usernameOrPhone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  goToEod: () => void;
  goToLogin: () => void;
  goToAdmin: () => void;
  goToPos: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_AUTH_KEY = 'zeytin_pos_active_cashier';
const STORAGE_TOKEN_KEY = 'zeytin_pos_token';

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
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      if (activeView !== 'LOGIN') {
        setActiveView('LOGIN');
      }
    }
  }, [cashier]);

  const login = async (usernameOrPhone: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { user } = await posService.login(usernameOrPhone, password);
      if (user) {
        const cashierObj: Cashier = {
          id: user.id,
          name: user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.username,
          username: user.username,
          phone: user.phone,
          role: user.role,
        };
        setCashier(cashierObj);
        setActiveView(user.role === 'admin' ? 'ADMIN' : 'POS');
        return { success: true };
      }
      return { success: false, message: 'Giriş yapılamadı. Kullanıcı bulunamadı.' };
    } catch (err: unknown) {
      return { success: false, message: getTurkishWarning(err, 'Giriş yapılamadı. Bilgilerinizi kontrol edip tekrar deneyin.') };
    }
  };

  const logout = () => {
    localStorage.removeItem('zeytin_pos_token');
    setCashier(null);
    localStorage.removeItem(STORAGE_AUTH_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    setActiveView('LOGIN');
  };

  const goToEod = () => setActiveView('EOD');
  const goToLogin = () => setActiveView('LOGIN');
  const goToAdmin = () => setActiveView('ADMIN');
  const goToPos = () => setActiveView('POS');

  return (
    <AuthContext.Provider value={{ cashier, activeView, login, logout, goToEod, goToLogin, goToAdmin, goToPos }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('Yetkilendirme bileşeni kullanılamıyor.');
  }
  return context;
};
