import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { posService } from '../api/posService';
import { EndOfDaySummary } from '../types/pos';
import { formatCurrency } from '../utils/format';
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  Banknote, 
  CreditCard, 
  UserCheck,
  TrendingUp, 
  Receipt, 
  RotateCcw, 
  CheckCircle2, 
  Printer, 
  Lock,
  Calendar,
  Loader2
} from 'lucide-react';

export const EndOfDayView: React.FC = () => {
  const { goToLogin, cashier } = useAuth();
  const [summary, setSummary] = useState<EndOfDaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await posService.getEndOfDaySummary();
      setSummary(data);
    } catch {
      setError('Gün sonu özeti alınamadı.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleCloseDay = async () => {
    if (!window.confirm('Bugünün kasasını kapatmak ve Gün Sonu Z-Raporunu kesinleştirmek istediğinize emin misiniz?')) {
      return;
    }

    setIsClosing(true);
    setError('');
    try {
      await posService.closeEndOfDay(cashier?.role);
      setCloseSuccess(true);
      await loadSummary();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gün sonu kapatılamadı.';
      setError(msg);
    } finally {
      setIsClosing(false);
    }
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* Top Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 p-2 rounded-xl text-white shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900">
              GÜN SONU & Z-RAPORU
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tarih: {summary?.date || new Date().toLocaleDateString('tr-TR')}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={goToLogin}
          className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Açılış Ekranına Dön</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-3 max-w-5xl w-full mx-auto">
        {isLoading && (
          <div className="p-8 text-center text-gray-500 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-zeytin-700" />
            <span className="text-xs font-bold">Rapor verileri yükleniyor...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs">
            {error}
          </div>
        )}

        {closeSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Gün sonu işlemi başarıyla tamamlandı. Rapor arşivlendi.</span>
          </div>
        )}

        {/* 6 Main Summary Metric Cards (Toplam Ciro, Nakit, Kart, Cari, İşlem, İptal) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* 1. Toplam Ciro */}
          <div className="bg-gradient-to-br from-zeytin-800 to-zeytin-950 text-white rounded-xl p-3 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between opacity-80 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Toplam Ciro</span>
              <TrendingUp className="w-4 h-4 text-zeytin-300" />
            </div>
            <div className="text-lg sm:text-xl font-black tracking-tight">
              {formatCurrency(summary?.totalRevenue || 0)}
            </div>
            <span className="text-[9px] text-zeytin-200 block">
              Tüm Satışlar (N+K+C)
            </span>
          </div>

          {/* 2. Nakit Satış */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Nakit Satış</span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-gray-900">
              {formatCurrency(summary?.totalCash || 0)}
            </div>
            <span className="text-[9px] text-gray-400 block">
              Kasadaki Nakit
            </span>
          </div>

          {/* 3. Kart Satış */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Kart Satış</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-gray-900">
              {formatCurrency(summary?.totalCard || 0)}
            </div>
            <span className="text-[9px] text-gray-400 block">
              POS / Banka
            </span>
          </div>

          {/* 4. Cari Satış (Açık Hesap) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Cari Satış</span>
              <UserCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-amber-900">
              {formatCurrency(summary?.totalCredit || 0)}
            </div>
            <span className="text-[9px] text-gray-400 block">
              Veresiye / Alacak
            </span>
          </div>

          {/* 5. İşlem Sayısı */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">İşlem Sayısı</span>
              <Receipt className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-gray-900">
              {summary?.transactionCount || 0}
            </div>
            <span className="text-[9px] text-gray-400 block">
              Tamamlanan Fiş
            </span>
          </div>

          {/* 6. İptal / İade */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">İptal / İade</span>
              <RotateCcw className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-base sm:text-lg font-black text-gray-900">
              {summary?.cancelledCount || 0}
            </div>
            <span className="text-[9px] text-gray-400 block">
              İptal Kayıtları
            </span>
          </div>
        </div>

        {/* Sales List Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-gray-800">
              Bugün Yapılan Satış Kayıtları
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              ZeytinERP Cari & Kasa Hareketleri
            </span>
          </div>

          <div className="overflow-x-auto max-h-64 divide-y divide-gray-100">
            {(!summary?.sales || summary.sales.length === 0) ? (
              <div className="p-6 text-center text-gray-400 font-medium text-xs">
                Bugün henüz kayıtlı bir satış bulunmuyor.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[9px]">
                  <tr>
                    <th className="px-3 py-2">Fiş No</th>
                    <th className="px-3 py-2">Saat</th>
                    <th className="px-3 py-2">Kasa</th>
                    <th className="px-3 py-2">Kasiyer</th>
                    <th className="px-3 py-2">Cari Müşteri</th>
                    <th className="px-3 py-2">Ürün Adedi</th>
                    <th className="px-3 py-2">Ödeme Türü</th>
                    <th className="px-3 py-2 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {summary.sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50/80 font-medium">
                      <td className="px-3 py-2 font-mono font-bold text-gray-900">{sale.receiptNo}</td>
                      <td className="px-3 py-2 text-gray-500">{sale.time}</td>
                      <td className="px-3 py-2">Kasa {sale.kasaId}</td>
                      <td className="px-3 py-2">{sale.cashierName}</td>
                      <td className="px-3 py-2">
                        {sale.customerName ? (
                          <span className="font-extrabold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {sale.customerName}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{sale.itemsCount} adet</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          sale.paymentType === 'CASH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentType === 'CARD'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {sale.paymentType === 'CASH' ? 'NAKİT' : sale.paymentType === 'CARD' ? 'KART' : 'CARİ'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-black text-gray-900">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
          <div className="text-[11px] text-gray-500">
            <span className="font-bold text-gray-700">Muhasebe Notu:</span>
            Cari satışlar ciroya dahildir ancak kasa nakit veya banka/POS girişine dahil edilmez.
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintZReport}
              className="flex-1 sm:flex-none py-2 px-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Z-Raporu Yazdır</span>
            </button>

            <button
              type="button"
              disabled={isClosing || summary?.isClosed}
              onClick={handleCloseDay}
              className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center space-x-1.5 ${
                summary?.isClosed
                  ? 'bg-emerald-700 text-white cursor-default'
                  : 'bg-red-600 hover:bg-red-700 text-white active:scale-98'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{summary?.isClosed ? 'GÜN KAPATILDI' : 'GÜNÜ KAPAT'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
