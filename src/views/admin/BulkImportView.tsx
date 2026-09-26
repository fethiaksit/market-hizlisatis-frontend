import React, { useEffect, useState, useRef } from 'react';
import { BulkImportPreviewItem, BulkImportAction, Category, BulkImportResult } from '../../types/pos';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { 
  FileUp,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  AlertTriangle,
  Play
} from 'lucide-react';

export const BulkImportView: React.FC = () => {
  const { cashier } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewItems, setPreviewItems] = useState<BulkImportPreviewItem[]>([]);
  const [existingAction, setExistingAction] = useState<BulkImportAction>('UPDATE_INFO');
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [, setCategories] = useState<Category[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    posService.getCategories()
      .then(setCategories)
      .catch(() => setErrorMsg('Kategoriler yüklenemedi. Önce kategori bağlantısını kontrol edin.'));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    setImportResult(null);
    setPreviewItems([]);
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.csv')) {
        setErrorMsg('Lütfen sadece .csv uzantılı dosya yükleyin.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      parseFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const parseFile = (f: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const [freshCategories, products] = await Promise.all([
          posService.getCategories(),
          posService.getAdminProducts('', true, cashier?.role),
        ]);
        setCategories(freshCategories);
        const items = posService.previewBulkImport(text, freshCategories, products);
        if (items.length === 0) {
          setErrorMsg('Dosya boş veya formatı hatalı. Lütfen örnek şablona uygun dosya yükleyin.');
        } else {
          setPreviewItems(items);
        }
      } catch {
        setErrorMsg('Dosya okunurken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Dosya okunamadı.');
      setLoading(false);
    };
    reader.readAsText(f);
  };

  const handleExecuteImport = async () => {
    if (previewItems.length === 0) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setImportResult(null);
    
    try {
      const result = await posService.executeBulkImport(
        previewItems, 
        existingAction, 
        cashier?.name || 'Admin', 
        cashier?.role
      );
      
      setImportResult(result);
      setSuccessMsg(
        `CSV aktarımı tamamlandı. Yeni ürün: ${result.created}, Güncellenen ürün: ${result.updated}, Stok girişi: ${result.stockAdded}, Atlanan: ${result.skipped}${result.failed > 0 ? `, Hatalı: ${result.failed}` : ''}`
      );
      setPreviewItems([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Toplu içe aktarma sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'barkod;ürün_adı;satış_fiyatı;alış_fiyatı;stok;kategori;birim\n8691234567890;Örnek Ürün;15,50;10,00;50;Atıştırmalık;Adet\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'zeytin_market_urun_sablonu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    total: previewItems.length,
    new: previewItems.filter(i => i.status === 'NEW').length,
    exists: previewItems.filter(i => i.status === 'EXISTS').length,
    error: previewItems.filter(i => i.status === 'ERROR').length,
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center space-x-2">
            <FileUp className="w-6 h-6 text-zeytin-600" />
            <span>Toplu Ürün & Fiyat İçe Aktarma</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Excel (CSV) dosyasından sisteme yüzlerce ürünü tek seferde yükleyin.</p>
        </div>
        
        <button
          onClick={handleDownloadTemplate}
          className="w-full sm:w-auto text-zeytin-700 hover:text-zeytin-800 bg-zeytin-50 hover:bg-zeytin-100 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors border border-zeytin-200 cursor-pointer min-h-[44px] text-sm"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Örnek Şablonu İndir</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start space-x-3 shrink-0">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start space-x-3 shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {importResult && importResult.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shrink-0">
          <h4 className="font-bold text-sm mb-2 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Aktarılamayan Hatalı Satırlar ({importResult.errors.length})</span>
          </h4>
          <ul className="text-xs space-y-1 max-h-40 overflow-auto font-mono bg-white/60 p-2 rounded-lg border border-red-100">
            {importResult.errors.map((err, idx) => (
              <li key={idx} className="text-red-700">
                Satır {err.row} - Barkod: {err.barcode || 'Boş'} - {err.name ? `${err.name} - ` : ''}{err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-gray-100 shrink-0">
        <label className="block w-full cursor-pointer">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={loading}
          />
          <div className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center transition-colors ${file ? 'border-zeytin-500 bg-zeytin-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
            <UploadCloud className={`w-10 h-10 sm:w-12 sm:h-12 mb-3 ${file ? 'text-zeytin-600' : 'text-gray-400'}`} />
            <span className="text-sm sm:text-base font-bold text-gray-700 text-center">
              {file ? file.name : 'CSV dosyasını seçmek için tıklayın'}
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center">Sadece .csv uzantılı ve noktalı virgül (;) ile ayrılmış dosyalar</span>
          </div>
        </label>
      </div>

      {previewItems.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Action Settings & Stats */}
          <div className="bg-white p-4 border border-gray-100 rounded-t-2xl shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-gray-600">
              <span className="text-gray-900 font-bold">Önizleme:</span>
              <span className="text-blue-600 font-bold">{stats.new} Yeni</span>
              <span className="text-amber-600 font-bold">{stats.exists} Mevcut</span>
              {stats.error > 0 && <span className="text-red-600 font-bold">{stats.error} Hatalı</span>}
              <span className="text-gray-400">| Toplam: {stats.total} Satır</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <label className="text-xs font-bold text-gray-700 shrink-0">Mevcut Ürünler:</label>
              <select
                value={existingAction}
                onChange={(e) => setExistingAction(e.target.value as BulkImportAction)}
                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-zeytin-500 focus:outline-none"
              >
                <option value="UPDATE_INFO">Bilgileri Güncelle (Stok Değişmesin)</option>
                <option value="ADD_STOCK_ONLY">Sadece Stok Ekle (Fiyat/Ad sabit)</option>
                <option value="SKIP">Atla (İşlem Yapma)</option>
              </select>

              <button
                onClick={handleExecuteImport}
                disabled={loading || (stats.new === 0 && stats.exists === 0)}
                className="bg-zeytin-600 hover:bg-zeytin-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-md transition-colors shrink-0 text-sm cursor-pointer min-h-[44px]"
              >
                <Play className="w-4 h-4" fill="currentColor" />
                <span>Aktarımı Başlat</span>
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white border-x border-b border-gray-100 rounded-b-2xl shadow-xs flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Satır</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Barkod</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ürün Adı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Satış Fiyatı</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Stok</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-1/4">Hata/Bilgi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewItems.map((item, idx) => (
                  <tr key={idx} className={item.status === 'ERROR' ? 'bg-red-50/50' : item.status === 'EXISTS' ? 'bg-amber-50/30' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{item.lineNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.status === 'NEW' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">YENİ</span>}
                      {item.status === 'EXISTS' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">MEVCUT</span>}
                      {item.status === 'ERROR' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">HATA</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">{item.barcode || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.name || '-'}
                      {item.status === 'EXISTS' && item.existingProduct && item.existingProduct.name !== item.name && (
                        <div className="text-xs text-amber-600 line-through">{item.existingProduct.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {item.category ? (
                        <span className={item.status === 'ERROR' && item.errorMessage?.startsWith('Kategori eşleşmedi')
                          ? 'font-bold text-red-600'
                          : 'font-bold text-zeytin-700'}>
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">Kategorisiz</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.price > 0 ? `${item.price.toFixed(2)} ₺` : '-'}
                      {item.status === 'EXISTS' && item.existingProduct && item.existingProduct.price !== item.price && (
                        <div className="text-xs text-amber-600 line-through">{item.existingProduct.price.toFixed(2)} ₺</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.stock !== undefined ? `+${item.stock}` : '-'}
                      {item.status === 'EXISTS' && item.existingProduct && (
                        <div className="text-xs text-gray-500">Mevcut: {item.existingProduct.stock}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.status === 'ERROR' ? (
                        <div className="flex items-center text-red-600 font-medium">
                          <AlertTriangle className="w-4 h-4 mr-1 shrink-0" />
                          <span>{item.errorMessage}</span>
                        </div>
                      ) : item.status === 'EXISTS' ? (
                        <span className="text-amber-700 text-xs">Barkod kullanımda. Aksiyon ayarına göre işlem görecek.</span>
                      ) : (
                        <span className="text-green-600 text-xs">Sorunsuz eklenecek.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
