import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { getApiBaseUrl, setApiBaseUrl, isMockMode, setMockMode } from '../api/apiClient';
import { X, Check, Server, RefreshCw } from 'lucide-react';

export const ApiSettingsModal: React.FC = () => {
  const { isApiSettingsOpen, setApiSettingsOpen, refreshProducts, showToast } = usePos();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [useMock, setUseMock] = useState(isMockMode());

  if (!isApiSettingsOpen) return null;

  const handleSave = async () => {
    setApiBaseUrl(apiUrl.trim());
    setMockMode(useMock);
    await refreshProducts();
    showToast('Bağlantı ayarları güncellendi', 'success');
    setApiSettingsOpen(false);
  };

  const handleResetData = () => {
    if (window.confirm('Demo ürün ve satış kayıtları ilk durumuna sıfırlansın mı?')) {
      localStorage.removeItem('zeytin_pos_products');
      localStorage.removeItem('zeytin_pos_sales');
      localStorage.removeItem('zeytin_pos_kasas_state');
      localStorage.removeItem('zeytin_pos_eod_state');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-gray-100 animate-in fade-in duration-150 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-gray-900">
            <Server className="w-6 h-6 text-zeytin-700" />
            <h3 className="text-lg font-black">ZeytinERP Bağlantı & API Ayarları</h3>
          </div>
          <button
            type="button"
            onClick={() => setApiSettingsOpen(false)}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Mock vs Live switch */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-gray-900 block">Çevrimdışı / Demo (Mock) Modu</span>
                <span className="text-xs text-gray-500">
                  Backend olmadan tarayıcı içi veritabanı ile çalışır.
                </span>
              </div>
              <input
                type="checkbox"
                checked={useMock}
                onChange={(e) => setUseMock(e.target.checked)}
                className="w-5 h-5 text-zeytin-600 rounded focus:ring-zeytin-500"
              />
            </label>
          </div>

          {/* Backend URL Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              ZeytinERP API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://192.168.1.100:8000/api"
              disabled={useMock}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-gray-300 focus:border-zeytin-600 rounded-xl font-mono text-xs text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              Market kasası yerel ağdaki ZeytinERP sunucusuna bağlanır.
            </span>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetData}
              className="w-full py-2 px-3 border border-gray-300 hover:bg-red-50 hover:text-red-700 text-gray-600 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Demo Verilerini & Sepetleri Sıfırla</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setApiSettingsOpen(false)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-zeytin-700 hover:bg-zeytin-800 text-white font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Ayarları Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
