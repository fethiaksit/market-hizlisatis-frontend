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
  X
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

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Only active products generally need price management, but let's allow all for now.
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

  const handleSavePrice = async (product: Product) => {
    const val = newPrices[product.id];
    if (!val) return;

    const newPriceNum = parseFloat(val.replace(',', '.'));
    if (isNaN(newPriceNum) || newPriceNum <= 0) {
      setErrorMsg('Lütfen geçerli bir fiyat giriniz.');
      return;
    }

    if (newPriceNum === product.price) {
      // No change
      const newMap = { ...newPrices };
      delete newMap[product.id];
      setNewPrices(newMap);
      return;
    }

    setSavingId(product.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await posService.updateProductPrice(product.id, newPriceNum, cashier?.name || 'Admin', cashier?.role);
      setSuccessMsg(`${product.name} fiyatı ${newPriceNum.toFixed(2)} ₺ olarak güncellendi.`);
      
      // Update local products
      setProducts(prev => prev.map(p => 
        String(p.id) === String(product.id) ? { ...p, price: newPriceNum } : p
      ));
      
      // Clear input
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

  return (
    <div className="p-6 h-full flex flex-col max-w-6xl mx-auto">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-black text-gray-800 flex items-center space-x-2">
          <Tag className="w-6 h-6 text-zeytin-600" />
          <span>Fiyat Yönetimi</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Ürün satış fiyatlarını hızlıca güncelleyin ve geçmişi inceleyin.</p>
      </div>

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-start space-x-3 shrink-0">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start space-x-3 shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 mb-4 shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:border-zeytin-500 sm:text-sm transition-colors"
            placeholder="Barkod veya ürün adı ile ürün ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Barkod / Ürün</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mevcut Fiyat</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Yeni Fiyat</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">Yükleniyor...</td>
                </tr>
              ) : displayProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">
                    Kayıtlı ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                displayProducts.map((product) => {
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
                            className={`p-2 rounded-lg flex items-center space-x-1 transition-colors text-xs font-bold ${
                              hasChanges 
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title="Kaydet"
                          >
                            <Save className="w-4 h-4" />
                            <span>Kaydet</span>
                          </button>
                          
                          <button
                            onClick={() => handleOpenHistory(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center"
                            title="Fiyat Geçmişi"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyModalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-800">Fiyat Geçmişi</h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  {historyModalProduct.name} <span className="font-mono text-xs">({historyModalProduct.barcode})</span>
                </p>
              </div>
              <button 
                onClick={() => setHistoryModalProduct(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 bg-gray-50">
              {historyLoading ? (
                <div className="p-10 text-center text-gray-500">Yükleniyor...</div>
              ) : priceHistory.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <History className="w-12 h-12 opacity-20" />
                  <p>Bu ürün için herhangi bir fiyat değişikliği geçmişi bulunmuyor.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Eski Fiyat</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Yeni Fiyat</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase pl-10">Değiştiren</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {priceHistory.map(entry => (
                      <tr key={entry.id} className="hover:bg-white transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(entry.changedAt).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 line-through">
                          {entry.oldPrice.toFixed(2)} ₺
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700">
                          {entry.newPrice.toFixed(2)} ₺
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 pl-10">
                          {entry.changedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
