import React, { useState, useEffect } from 'react';
import { SaleRecord } from '../types/pos';
import { posService } from '../api/posService';
import { formatCurrency } from '../utils/format';
import { Receipt, X, Printer, Calendar, Clock, User, Store, Loader2, Tag } from 'lucide-react';

interface ReceiptDetailModalProps {
  saleIdOrReceiptNo: string | null;
  onClose: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({ saleIdOrReceiptNo, onClose }) => {
  const [sale, setSale] = useState<SaleRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!saleIdOrReceiptNo) return;
    setLoading(true);
    posService.getSaleDetail(saleIdOrReceiptNo)
      .then(res => setSale(res))
      .finally(() => setLoading(false));
  }, [saleIdOrReceiptNo]);

  if (!saleIdOrReceiptNo) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-zeytin-300" />
            <h3 className="text-base font-black tracking-wide">
              ALIŞVERİŞ FİŞ DETAYI
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-zeytin-700" />
              <span className="text-xs font-bold">Fiş detayları getiriliyor...</span>
            </div>
          ) : !sale ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              Fiş detaylarına ulaşılamadı.
            </div>
          ) : (
            <>
              {/* Receipt Header Info */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="font-mono font-black text-gray-900 text-sm">
                    {sale.receiptNo}
                  </div>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                    sale.paymentType === 'CREDIT'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : sale.paymentType === 'CARD'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {sale.paymentType === 'CREDIT' ? 'ÖDEME: CARİ (AÇIK HESAP)' : sale.paymentType === 'CARD' ? 'ÖDEME: KART' : 'ÖDEME: NAKİT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-gray-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{sale.date}</span>
                    <Clock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                    <span>{sale.time}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5">
                    <Store className="w-3.5 h-3.5 text-gray-400" />
                    <span>Kasa {sale.kasaId}</span>
                    <User className="w-3.5 h-3.5 text-gray-400 ml-1" />
                    <span>{sale.cashierName}</span>
                  </div>
                </div>

                {sale.customerName && (
                  <div className="pt-1 text-amber-900 font-extrabold flex items-center gap-1 border-t border-gray-200 mt-1">
                    <span>Cari Müşteri:</span>
                    <span>{sale.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-100/80 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                  <span>Ürün Bilgisi</span>
                  <span>Tutar</span>
                </div>

                <div className="divide-y divide-gray-100 p-1 space-y-1">
                  {(!sale.items || sale.items.length === 0) ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      Ürün detayı bulunamadı.
                    </div>
                  ) : (
                    sale.items.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between text-xs hover:bg-gray-50/80 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-gray-900 leading-tight">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 font-mono">
                            <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                            {item.discount && item.discount > 0 ? (
                              <span className="text-amber-700 font-bold flex items-center gap-0.5">
                                <Tag className="w-3 h-3" />
                                {formatCurrency(item.discount)} İndirim
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-right font-black text-gray-900 text-xs sm:text-sm pl-2">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary Totals */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs space-y-1.5">
                {sale.subtotal !== undefined && sale.subtotal !== sale.total && (
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam:</span>
                    <span className="font-bold">{formatCurrency(sale.subtotal)}</span>
                  </div>
                )}

                {sale.discountTotal && sale.discountTotal > 0 ? (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Uygulanan İndirim:</span>
                    <span>-{formatCurrency(sale.discountTotal)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between items-baseline pt-1.5 border-t border-gray-200">
                  <span className="font-black text-gray-800 text-sm uppercase">FİŞ TOPLAMI:</span>
                  <span className="font-black text-xl text-zeytin-800">{formatCurrency(sale.total)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2 px-3.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Fiş Yazdır</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
