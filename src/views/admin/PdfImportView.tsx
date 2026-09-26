import React, { useState, useRef } from 'react';
import { FileText, UploadCloud, Loader2, CheckCircle2, AlertTriangle, AlertCircle, Trash2, Save, X } from 'lucide-react';
import { invoiceAnalysisService } from '../../api/invoiceAnalysisService';
import { InvoiceAnalyzeResponse, ParsedInvoiceItem } from '../../types/pos';
import { useAuth } from '../../context/AuthContext';

export const PdfImportView: React.FC = () => {
  const { cashier } = useAuth();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'preview'>('upload');
  const [invoiceData, setInvoiceData] = useState<InvoiceAnalyzeResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== 'application/pdf') {
      setError('Lütfen geçerli bir PDF dosyası seçin.');
      return;
    }
    
    setError('');
    startAnalysis(selectedFile);
  };

  const startAnalysis = async (pdfFile: File) => {
    setStep('analyzing');
    try {
      const result = await invoiceAnalysisService.analyzePdf(pdfFile, cashier?.role);
      setInvoiceData(result);
      setStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analiz sırasında hata oluştu.');
      setStep('upload');
    }
  };

  const handleItemChange = (id: string, field: keyof ParsedInvoiceItem, value: any) => {
    if (!invoiceData) return;
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const handleRemoveItem = (id: string) => {
    if (!invoiceData) return;
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter(item => item.id !== id)
    });
  };

  const handleCancel = () => {
    setStep('upload');
    setInvoiceData(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!invoiceData) return;
    
    // Doğrulama: Yeni ürünlerde satış fiyatı ve barkod boş olmamalı
    const newItems = invoiceData.items.filter(i => i.matchStatus === 'new');
    for (const item of newItems) {
      if (!item.salePrice || item.salePrice <= 0) {
        setError(`"${item.productName}" yeni bir ürün olduğu için Satış Fiyatı girilmesi zorunludur.`);
        return;
      }
      if (!item.barcode) {
        setError(`"${item.productName}" yeni bir ürün olduğu için Barkod girilmesi zorunludur.`);
        return;
      }
    }

    const incompleteItems = invoiceData.items.filter(i => i.matchStatus === 'incomplete');
    if (incompleteItems.length > 0) {
      if (!confirm('Eksik bilgi içeren satırlar var. Bunlar sisteme aktarılmayacak. Devam etmek istiyor musunuz?')) {
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await invoiceAnalysisService.importInvoice(invoiceData, cashier?.role);
      alert(res.message);
      handleCancel(); // Reset
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'İçe aktarma sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched': return <span title="Mevcut Ürün"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></span>;
      case 'new': return <span title="Yeni Ürün"><AlertCircle className="w-5 h-5 text-blue-500" /></span>;
      case 'review_needed': return <span title="Farklı İsim/Kontrol"><AlertTriangle className="w-5 h-5 text-amber-500" /></span>;
      default: return <span title="Eksik Bilgi"><X className="w-5 h-5 text-red-500" /></span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-zeytin-600" />
            <span>PDF'den Ürün Aktar</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Tedarikçi faturasını yükleyin, yapay zeka içerisindeki ürünleri çıkarıp stoğa eklesin.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-sm font-medium flex items-center space-x-2 shrink-0">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'upload' && (
        <div 
          className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center p-6 sm:p-10 hover:bg-gray-50 transition-colors cursor-pointer min-h-[300px]"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 text-center">Fatura PDF Dosyasını Seçin</h3>
          <p className="text-gray-500 text-xs sm:text-sm max-w-md text-center">
            Sürükleyip bırakın veya cihazınızdan seçmek için tıklayın. Sadece .pdf formatı desteklenmektedir.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            className="hidden" 
          />
        </div>
      )}

      {step === 'analyzing' && (
        <div className="flex-1 bg-white rounded-3xl flex flex-col items-center justify-center p-8 shadow-sm min-h-[300px]">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Belge İnceleniyor...</h3>
          <p className="text-gray-500 text-sm text-center">
            Yapay zeka fatura kalemlerini tespit edip mevcut stoğunuzla eşleştiriyor. Lütfen bekleyin.
          </p>
        </div>
      )}

      {step === 'preview' && invoiceData && (
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl shadow-xs border border-gray-200 min-h-0">
          <div className="p-3.5 sm:p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-500">Tedarikçi</span>
                <span className="font-bold text-gray-900 text-sm">{invoiceData.supplierName}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-500">Fatura No</span>
                <span className="font-bold text-gray-900 text-sm">{invoiceData.invoiceNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-500">Tarih</span>
                <span className="font-bold text-gray-900 text-sm">{invoiceData.invoiceDate}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[40px]"
              >
                İptal Et
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Onayla ve Stoğa İşle</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-100/50 text-gray-600 font-bold sticky top-0 z-10 text-[11px] uppercase">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">Durum</th>
                  <th className="px-4 py-3">Barkod</th>
                  <th className="px-4 py-3">Ürün Adı</th>
                  <th className="px-4 py-3 w-24">Adet</th>
                  <th className="px-4 py-3 w-32">Alış F. (₺)</th>
                  <th className="px-4 py-3 w-32">Satış F. (₺)</th>
                  <th className="px-4 py-3 w-16 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoiceData.items.map(item => (
                  <tr key={item.id} className={item.matchStatus === 'incomplete' ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 text-center">
                      {getStatusIcon(item.matchStatus)}
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        value={item.barcode} 
                        onChange={(e) => handleItemChange(item.id, 'barcode', e.target.value)}
                        className="w-32 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none font-mono text-xs text-base sm:text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <input 
                        type="text" 
                        value={item.productName} 
                        onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                        className="w-full min-w-[200px] bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none text-base sm:text-sm"
                      />
                      {item.matchStatus === 'new' && (
                        <span className="ml-2 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">Yeni</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        className="w-16 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none font-bold text-base sm:text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        step="0.01" 
                        value={item.purchasePrice} 
                        onChange={(e) => handleItemChange(item.id, 'purchasePrice', Number(e.target.value))}
                        className="w-20 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none text-base sm:text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {item.matchStatus === 'new' ? (
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="Zorunlu"
                          value={item.salePrice || ''} 
                          onChange={(e) => handleItemChange(item.id, 'salePrice', Number(e.target.value))}
                          className="w-24 bg-amber-50 border border-amber-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-amber-900 font-bold text-base sm:text-sm"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs italic" title="Mevcut satış fiyatı korunur">Değişmez</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Satırı Çıkar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-white border-t border-gray-200 text-xs text-gray-500 flex flex-wrap gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mevcut ürün, stok eklenecek</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Yeni ürün, Satış Fiyatı zorunlu</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Kısmi eşleşme, lütfen adı/barkodu kontrol edin</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
