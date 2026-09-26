import React, { useState, useEffect } from 'react';
import { Product, PriceHistory } from '../../types/pos';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { 
  Tag,
  Search,
  History,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';

export const PriceManagementView: React.FC = () => {
  const { cashier } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local state for inline price editing
  const [newPrices, setNewPrices] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | number | null>(null);

  // History modal state
  const [historyModalProduct, setHistoryModalProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Bulk Price Change modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'percent' | 'fixed'>('percent');
  const [bulkDirection, setBulkDirection] = useState<'increase' | 'decrease'>('increase');
  const [bulkValue, setBulkValue] = useState<string>('10');
  const [bulkApplying, setBulkApplying] = useState(false);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await posService.getAdminProducts('', false, cashier?.role);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (id: string | number, value: string) => {
    setNewPrices(prev => ({ ...prev, [id]: value }));
  };

  const handleSavePrice = async (product: Product, bypassWarning: boolean = false) => {
    const val = newPrices[product.id];
    if (!val) return;

    const newPriceNum = parseFloat(val.replace(',', '.'));
    if (isNaN(newPriceNum) || newPriceNum <= 0) {
      setErrorMsg('Lütfen geçerli bir fiyat giriniz.');
      return;
    }

    if (newPriceNum === product.price) {
      const newMap = { ...newPrices };
      delete newMap[product.id];
      setNewPrices(newMap);
      return;
    }

    // Low price warning check
    if (!bypassWarning) {
      if (newPriceNum < 1) {
        if (!window.confirm(`Dikkat: "${product.name}" için girilen fiyat 1 TL'nin altında (${newPriceNum.toFixed(2)} ₺). Onaylıyor musunuz?`)) {
          return;
        }
      } else if (newPriceNum < product.price * 0.5) {
        if (!window.confirm(`Dikkat: "${product.name}" fiyatı %50'den fazla düşürülüyor (${product.price.toFixed(2)} ₺ -> ${newPriceNum.toFixed(2)} ₺). Onaylıyor musunuz?`)) {
          return;
        }
      }
    }

    setSavingId(product.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await posService.updateProductPrice(product.id, newPriceNum, cashier?.name || 'Admin', cashier?.role);
      setSuccessMsg(`${product.name} fiyatı ${newPriceNum.toFixed(2)} ₺ olarak güncellendi.`);
      
      setProducts(prev => prev.map(p => 
        String(p.id) === String(product.id) ? { ...p, price: newPriceNum } : p
      ));
      
      const newMap = { ...newPrices };
      delete newMap[product.id];
      setNewPrices(newMap);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Fiyat güncellenemedi.');
    } finally {
      setSavingId(null);
    }
  };

  const handleOpenHistory = async (product: Product) => {
    setHistoryModalProduct(product);
    setHistoryLoading(true);
    try {
      const history = await posService.getPriceHistory(product.id, cashier?.role);
      setPriceHistory(history);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const displayProducts = products.filter(p => 
    searchQuery === '' || 
    p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Bulk price calculation helper
  const calculateNewPrice = (currentPrice: number): number => {
    const val = parseFloat(bulkValue) || 0;
    if (val <= 0) return currentPrice;

    let res = currentPrice;
    if (bulkMode === 'percent') {
      const delta = (currentPrice * val) / 100;
      res = bulkDirection === 'increase' ? currentPrice + delta : Math.max(0.1, currentPrice - delta);
    } else {
      res = bulkDirection === 'increase' ? currentPrice + val : Math.max(0.1, currentPrice - val);
    }
    return Math.round(res * 100) / 100;
  };

  const hasBulkLowPriceWarning = displayProducts.some(p => {
    const calculated = calculateNewPrice(p.price);
    return calculated < 1 || (bulkDirection === 'decrease' && calculated < p.price * 0.5);
  });

  const handleApplyBulkPrice = async () => {
    if (displayProducts.length === 0) return;
    const val = parseFloat(bulkValue);
    if (isNaN(val) || val <= 0) {
      alert('Lütfen geçerli bir değer girin.');
      return;
    }

    if (hasBulkLowPriceWarning) {
      const confirmed = window.confirm(
        'Dikkat: Toplu güncellemede bazı ürünlerin fiyatı 1 TL altına inmekte veya %50\'den fazla düşmektedir. Devam etmek istiyor musunuz?'
      );
      if (!confirmed) return;
    }

    setBulkApplying(true);
    let successCount = 0;

    try {
      for (const prod of displayProducts) {
        const nextPrice = calculateNewPrice(prod.price);
        if (nextPrice !== prod.price) {
          try {
            await posService.updateProductPrice(prod.id, nextPrice, cashier?.name || 'Admin', cashier?.role);
            successCount++;
          } catch (e) {
            console.error(`Failed to update ${prod.name}`, e);
          }
        }
      }

      setSuccessMsg(`${successCount} adet ürünün satış fiyatı başarıyla güncellendi.`);
      setIsBulkModalOpen(false);
      await loadProducts();
    } catch {
      setErrorMsg('Toplu fiyat güncelleme sırasında hata oluştu.');
    } finally {
      setBulkApplying(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center space-x-2">
            <Tag className="w-6 h-6 text-zeytin-600" />
            <span>Fiyat Yönetimi</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Ürün satış fiyatlarını hızlıca güncelleyin ve geçmişi inceleyin.</p>
        </div>

        <button
          onClick={() => setIsBulkModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-zeytin-700 hover:bg-zeytin-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-sm border border-zeytin-600 min-h-[44px]"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Toplu Fiyat Güncelle</span>
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

      {/* Search Input */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-gray-100 shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:border-zeytin-500 text-base sm:text-sm transition-colors font-medium"
            placeholder="Barkod veya ürün adı ile ürün ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Product List Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400 font-medium">Yükleniyor...</div>
          ) : displayProducts.length === 0 ? (
            <div className="p-10 text-center text-gray-500 font-medium">
              Kayıtlı ürün bulunamadı.
            </div>
          ) : (
            <>
              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-gray-100">
                {displayProducts.map((product) => {
                  const val = newPrices[product.id] || '';
                  const hasChanges = val.trim() !== '' && val.trim() !== product.price.toString();
                  const isSaving = savingId === product.id;

                  return (
                    <div key={product.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-gray-900 leading-snug">{product.name}</div>
                          <div className="text-xs font-mono text-gray-500 mt-0.5">{product.barcode}</div>
                        </div>
                        <button
                          onClick={() => handleOpenHistory(product)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          title="Fiyat Geçmişi"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div>
                          <div className="text-[11px] text-gray-500 font-bold uppercase">Mevcut</div>
                          <div className="text-sm font-black text-gray-900">{product.price.toFixed(2)} ₺</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={product.price.toString()}
                            value={val}
                            onChange={(e) => handlePriceChange(product.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && hasChanges) {
                                handleSavePrice(product);
                              }
                            }}
                            className="w-24 text-center px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none font-bold text-base bg-white"
                            disabled={isSaving}
                          />

                          <button
                            onClick={() => handleSavePrice(product)}
                            disabled={!hasChanges || isSaving}
                            className={`min-h-[44px] px-3.5 rounded-xl flex items-center justify-center space-x-1 transition-colors text-xs font-bold cursor-pointer ${
                              hasChanges 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title="Kaydet"
                          >
                            <Save className="w-4 h-4" />
                            <span>Kaydet</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Barkod / Ürün</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mevcut Fiyat</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Yeni Fiyat</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayProducts.map((product) => {
                      const val = newPrices[product.id] || '';
                      const hasChanges = val.trim() !== '' && val.trim() !== product.price.toString();
                      const isSaving = savingId === product.id;

                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{product.name}</div>
                            <div className="text-xs font-mono text-gray-500 mt-0.5">{product.barcode}</div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className="text-sm font-bold text-zeytin-700 bg-zeytin-50 px-2.5 py-1 rounded-lg">
                              {product.price.toFixed(2)} ₺
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2 w-32">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={product.price.toString()}
                                value={val}
                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && hasChanges) {
                                    handleSavePrice(product);
                                  }
                                }}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zeytin-500 focus:outline-none font-bold text-sm"
                                disabled={isSaving}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleSavePrice(product)}
                                disabled={!hasChanges || isSaving}
                                className={`p-2 rounded-lg flex items-center space-x-1 transition-colors text-xs font-bold cursor-pointer ${
                                  hasChanges 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                                title="Kaydet"
                              >
                                <Save className="w-4 h-4" />
                                <span>Kaydet</span>
                              </button>
                              
                              <button
                                onClick={() => handleOpenHistory(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center cursor-pointer"
                                title="Fiyat Geçmişi"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bulk Price Change Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-zeytin-700" />
                <h3 className="text-lg font-black text-gray-800">Toplu Fiyat Güncelle</h3>
              </div>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="p-2 bg-gray-200/60 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-900">
                Seçilen / filtrelenen <strong>{displayProducts.length}</strong> adet ürünün satış fiyatı güncellenecektir.
              </div>

              {/* Direction & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">İşlem Yönü</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBulkDirection('increase')}
                      className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition-all ${
                        bulkDirection === 'increase' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Artır</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkDirection('decrease')}
                      className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition-all ${
                        bulkDirection === 'decrease' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>Azalt</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Değişim Tipi</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBulkMode('percent')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        bulkMode === 'percent' ? 'bg-zeytin-700 text-white shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      Yüzde (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMode('fixed')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        bulkMode === 'fixed' ? 'bg-zeytin-700 text-white shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      Sabit (₺)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {bulkMode === 'percent' ? 'Oran (%)' : 'Tutar (₺)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none font-bold text-base sm:text-sm bg-gray-50 focus:bg-white"
                  placeholder={bulkMode === 'percent' ? 'Örn: 10' : 'Örn: 5.00'}
                />
              </div>

              {/* Preview */}
              {displayProducts.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2 text-xs">
                  <div className="font-bold text-gray-700">Örnek Fiyat Değişimi:</div>
                  <div className="divide-y divide-gray-200">
                    {displayProducts.slice(0, 3).map(p => {
                      const newP = calculateNewPrice(p.price);
                      return (
                        <div key={p.id} className="py-1.5 flex justify-between items-center">
                          <span className="truncate pr-2 font-medium text-gray-800">{p.name}</span>
                          <span className="font-mono whitespace-nowrap">
                            <span className="text-gray-400 line-through mr-1.5">{p.price.toFixed(2)} ₺</span>
                            <span className={`font-bold ${newP < 1 ? 'text-red-600' : 'text-emerald-700'}`}>
                              {newP.toFixed(2)} ₺
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warning */}
              {hasBulkLowPriceWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Uyarı: Bazı ürünlerin yeni fiyatı 1 TL altına inmekte veya %50'den fazla düşmektedir.
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors cursor-pointer min-h-[44px]"
                  disabled={bulkApplying}
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkPrice}
                  disabled={bulkApplying || displayProducts.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-zeytin-700 hover:bg-zeytin-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer min-h-[44px] flex items-center justify-center space-x-1"
                >
                  {bulkApplying ? 'Uygulanıyor...' : 'Fiyatları Uygula'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="min-w-0 pr-3">
                <h2 className="text-lg sm:text-xl font-black text-gray-800">Fiyat Geçmişi</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium truncate">
                  {historyModalProduct.name} <span className="font-mono text-xs">({historyModalProduct.barcode})</span>
                </p>
              </div>
              <button 
                onClick={() => setHistoryModalProduct(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 bg-gray-50">
              {historyLoading ? (
                <div className="p-10 text-center text-gray-500">Yükleniyor...</div>
              ) : priceHistory.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <History className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Bu ürün için herhangi bir fiyat değişikliği geçmişi bulunmuyor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tarih</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Eski</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Yeni</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase pl-6 sm:pl-10">Kullanıcı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {priceHistory.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-xs sm:text-sm text-gray-600 font-medium">
                            {new Date(entry.changedAt).toLocaleString('tr-TR')}
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-xs sm:text-sm text-right text-red-600 line-through">
                            {entry.oldPrice.toFixed(2)} ₺
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-emerald-700">
                            {entry.newPrice.toFixed(2)} ₺
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-xs sm:text-sm text-gray-500 pl-6 sm:pl-10">
                            {entry.changedBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
