import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../../types/pos';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { 
  Boxes,
  Search,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Minus,
  Check,
  History,
  Loader2
} from 'lucide-react';

interface StockEntryItem {
  product: Product;
  quantityToAdd: number;
  note: string;
}

interface CompletedStockEntry {
  id: string | number;
  productId: string | number;
  productName: string;
  barcode: string;
  addedQuantity: number;
  previousStock: number;
  newStock: number;
  unit: string;
  timestamp: string;
}

export const StockEntryView: React.FC = () => {
  const { cashier } = useAuth();
  
  const [barcodeInput, setBarcodeInput] = useState('');
  const [entries, setEntries] = useState<StockEntryItem[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<CompletedStockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<number | null>(null);

  // Guarantee cleanup of document body and active focus
  const cleanupBodyAndFocus = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
      // On touch devices, blur active element to close virtual keyboard cleanly
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        (document.activeElement as HTMLElement)?.blur();
        inputRef.current?.blur();
      }
    }
  }, []);

  // Set auto-dismissing success message
  const triggerSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = window.setTimeout(() => {
      setSuccessMsg('');
      successTimerRef.current = null;
    }, 4500);
  }, []);

  useEffect(() => {
    // Focus on initial mount on desktop
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      inputRef.current?.focus();
    }

    return () => {
      cleanupBodyAndFocus();
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, [cleanupBodyAndFocus]);

  const processBarcode = async (barcode: string) => {
    setErrorMsg('');
    
    if (!barcode.trim()) return;

    const trimmed = barcode.trim();
    setBarcodeInput('');

    // Check if already in the list
    const existingIndex = entries.findIndex(item => item.product.barcode.toLowerCase() === trimmed.toLowerCase());
    if (existingIndex >= 0) {
      const newEntries = [...entries];
      newEntries[existingIndex].quantityToAdd += 1;
      setEntries(newEntries);
      triggerSuccess(`${newEntries[existingIndex].product.name} adeti artırıldı (+1)`);
      return;
    }

    setIsSearching(true);
    try {
      const products = await posService.getAdminProducts(trimmed, false, cashier?.role);
      let product = products.find(p => p.barcode.toLowerCase() === trimmed.toLowerCase());
      
      // Fallback: match first exact name or single result
      if (!product && products.length === 1) {
        product = products[0];
      }

      if (product) {
        // If this product was recently updated in this session, reflect its newest stock
        const recent = recentCompleted.find(r => String(r.productId) === String(product!.id));
        const effectiveStock = recent ? recent.newStock : product.stock;
        const effectiveProduct = { ...product, stock: effectiveStock };

        setEntries(prev => [{ product: effectiveProduct, quantityToAdd: 1, note: 'Manuel stok girişi' }, ...prev]);
        triggerSuccess(`Listeye eklendi: ${product.name}`);
      } else {
        setErrorMsg(`Barkod bulunamadı: ${trimmed}`);
      }
    } catch (err) {
      console.error('Ürün arama hatası:', err);
      setErrorMsg('Ürün aranırken hata oluştu.');
    } finally {
      setIsSearching(false);
      cleanupBodyAndFocus();
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || isSearching || loading) return;
    await processBarcode(barcodeInput);
  };

  const handleScanDetected = async (barcode: string) => {
    setShowScanner(false);
    cleanupBodyAndFocus();
    await processBarcode(barcode);
  };

  const handleQuantityChange = (index: number, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) return;
    
    const newEntries = [...entries];
    newEntries[index].quantityToAdd = num;
    setEntries(newEntries);
  };

  const handleStepQuantity = (index: number, delta: number) => {
    const newEntries = [...entries];
    const newQty = Math.max(1, newEntries[index].quantityToAdd + delta);
    newEntries[index].quantityToAdd = newQty;
    setEntries(newEntries);
  };

  const handleNoteChange = (index: number, val: string) => {
    const newEntries = [...entries];
    newEntries[index].note = val;
    setEntries(newEntries);
  };

  const handleRemove = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  // Safe Submit Flow for a Single Item Row
  const handleSaveSingle = async (index: number) => {
    const item = entries[index];
    if (!item || loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      await posService.addStockMovement(
        item.product.id,
        item.quantityToAdd,
        'STOCK_IN',
        item.note || 'Manuel stok girişi',
        cashier?.name || 'Admin',
        cashier?.role
      );

      const previousStock = item.product.stock;
      const newStock = previousStock + item.quantityToAdd;

      // Add to recent completed list (showing new stock immediately)
      setRecentCompleted(prev => [
        {
          id: `${item.product.id}-${Date.now()}`,
          productId: item.product.id,
          productName: item.product.name,
          barcode: item.product.barcode,
          addedQuantity: item.quantityToAdd,
          previousStock,
          newStock,
          unit: item.product.unit,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 9)
      ]);

      // Remove from pending entries
      setEntries(prev => prev.filter((_, i) => i !== index));
      triggerSuccess(`${item.product.name} için +${item.quantityToAdd} ${item.product.unit} stok eklendi. Yeni Stok: ${newStock}`);
    } catch (err) {
      console.error('Stok kaydetme hatası:', err);
      setErrorMsg('Stok girişi kaydedilemedi. Tekrar deneyin.');
    } finally {
      setLoading(false);
      cleanupBodyAndFocus();
    }
  };

  // Safe Submit Flow for All Pending Items (Bulk Save)
  const handleSaveAll = async () => {
    if (entries.length === 0 || loading) return;
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const payload = entries.map(e => ({
        productId: e.product.id,
        quantity: e.quantityToAdd,
        note: e.note
      }));
      
      await posService.bulkStockEntry(payload, cashier?.name || 'Admin', cashier?.role);

      const newlyCompleted: CompletedStockEntry[] = entries.map(e => ({
        id: `${e.product.id}-${Date.now()}`,
        productId: e.product.id,
        productName: e.product.name,
        barcode: e.product.barcode,
        addedQuantity: e.quantityToAdd,
        previousStock: e.product.stock,
        newStock: e.product.stock + e.quantityToAdd,
        unit: e.product.unit,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      }));

      setRecentCompleted(prev => [...newlyCompleted, ...prev].slice(0, 15));
      triggerSuccess(`${entries.length} kalem ürün için stok girişi başarıyla kaydedildi.`);
      setEntries([]);
      setBarcodeInput('');
    } catch (err) {
      console.error('Stok toplu kaydetme hatası:', err);
      setErrorMsg('Stok girişi kaydedilemedi. Tekrar deneyin.');
    } finally {
      setLoading(false);
      cleanupBodyAndFocus();
    }
  };

  return (
    <div className="p-3 sm:p-6 h-full flex flex-col max-w-6xl mx-auto space-y-3.5 sm:space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-zeytin-600" />
            <span>Stok Girişi</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Barkod okutarak veya kamera ile listeye ekleyin, tek tek veya topluca kaydedin.
          </p>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer min-h-[44px] active:scale-95 ${
              loading ? 'bg-gray-400 cursor-not-allowed opacity-75' : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>TÜMÜNÜ KAYDET ({entries.length})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-start space-x-3 shrink-0 shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-bold flex-1 leading-snug">{successMsg}</div>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-2xl flex items-start space-x-3 shrink-0 shadow-xs animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-bold flex-1 leading-snug">{errorMsg}</div>
        </div>
      )}

      {/* Barcode Input & Camera Section */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-xs border border-gray-100 shrink-0">
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 relative min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="block w-full pl-11 pr-3 py-2.5 sm:py-3 text-base sm:text-sm border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:border-zeytin-500 transition-colors font-mono font-bold"
              placeholder="Ürün barkodunu okutun veya yazın..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              disabled={loading || isSearching}
            />
          </div>

          {/* Camera Scanner Button */}
          <button
            type="button"
            onClick={() => {
              cleanupBodyAndFocus();
              setShowScanner(true);
            }}
            disabled={loading || isSearching}
            className="min-h-[46px] min-w-[46px] px-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            title="Kamera ile Barkod Okut"
            aria-label="Kamera ile Barkod Okut"
          >
            <Camera className="w-5 h-5" />
            <span className="hidden md:inline ml-1.5 text-xs font-bold">Kamera</span>
          </button>

          {/* Add to List Button */}
          <button
            type="submit"
            disabled={!barcodeInput.trim() || loading || isSearching}
            className="min-h-[46px] bg-zeytin-600 hover:bg-zeytin-700 active:bg-zeytin-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center space-x-1.5 transition-all shrink-0 text-xs sm:text-sm cursor-pointer shadow-xs active:scale-95"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Aranıyor...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Listeye Ekle</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Pending Entries List Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs flex flex-col min-h-0 shrink-0">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-gray-800 text-sm">Giriş Yapılacak Ürünler ({entries.length})</h3>
            {entries.length > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
                Beklemede
              </span>
            )}
          </div>
          
          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={loading}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold text-white rounded-xl flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer min-h-[38px] active:scale-95 ${
                loading ? 'bg-gray-400 cursor-not-allowed opacity-75' : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
              }`}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{loading ? 'Kaydediliyor...' : 'Tümünü Kaydet'}</span>
            </button>
          )}
        </div>

        <div className="p-0">
          {entries.length === 0 ? (
            <div className="min-h-[160px] flex flex-col items-center justify-center text-gray-400 space-y-2 p-6 sm:p-8">
              <Boxes className="w-12 h-12 opacity-20 text-gray-500" />
              <p className="font-bold text-xs sm:text-sm text-center text-gray-600">
                Stok girişi yapılacak ürünleri barkod okutarak veya kamera ile ekleyin.
              </p>
              <p className="text-[11px] text-gray-400 text-center">
                Ürün eklendiğinde miktarı ayarlayıp tek tuşla stoğu güncelleyebilirsiniz.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-gray-100">
                {entries.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 leading-snug">{item.product.name}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">{item.product.barcode}</div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {/* Single Row Save Button */}
                        <button
                          type="button"
                          onClick={() => handleSaveSingle(index)}
                          disabled={loading}
                          className="min-h-[44px] min-w-[44px] px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer font-bold text-xs shadow-xs active:scale-95"
                          title="Bu Ürünü Kaydet"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          <span>Kaydet</span>
                        </button>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemove(index)}
                          disabled={loading}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Listeden Çıkar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-600">
                        <span>Mevcut Stok: </span>
                        <span className="font-extrabold text-gray-900">{item.product.stock} {item.product.unit}</span>
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          Yeni Olacak: {item.product.stock + item.quantityToAdd} {item.product.unit}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStepQuantity(index, -1)}
                          disabled={loading}
                          className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center text-lg active:scale-95 shadow-xs cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantityToAdd}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          disabled={loading}
                          className="w-14 text-center py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zeytin-500 focus:outline-none font-bold text-base bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepQuantity(index, 1)}
                          disabled={loading}
                          className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center text-lg active:scale-95 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => handleNoteChange(index, e.target.value)}
                        disabled={loading}
                        placeholder="Not / Açıklama ekleyin..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm font-medium transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Barkod / Ürün</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Mevcut Stok</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Eklenecek Miktar</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Yeni Stok</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Not / Açıklama</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((item, index) => (
                      <tr key={`${item.product.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{item.product.name}</div>
                          <div className="text-xs font-mono text-gray-500 mt-0.5">{item.product.barcode}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                            {item.product.stock} {item.product.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleStepQuantity(index, -1)}
                              disabled={loading}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantityToAdd}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              disabled={loading}
                              className="w-16 text-center px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zeytin-500 focus:outline-none font-bold text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleStepQuantity(index, 1)}
                              disabled={loading}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.product.stock + item.quantityToAdd} {item.product.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.note}
                            onChange={(e) => handleNoteChange(index, e.target.value)}
                            disabled={loading}
                            placeholder="Açıklama..."
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-xs transition-all"
                          />
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSaveSingle(index)}
                              disabled={loading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-all cursor-pointer active:scale-95"
                              title="Bu Ürünün Stoğunu Kaydet"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Kaydet</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(index)}
                              disabled={loading}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Listeden Çıkar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recently Completed Stock Entries Section (Yeni Stok Değeri Ekrana Gelir) */}
      {recentCompleted.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xs p-4 sm:p-5 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-gray-800">
                Son Güncellenen Stoklar ({recentCompleted.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setRecentCompleted([])}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
            >
              Listeyi Temizle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentCompleted.map((comp) => (
              <div 
                key={comp.id}
                className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-gray-900 truncate">
                    {comp.productName}
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                    {comp.barcode} • {comp.timestamp}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1 flex items-center space-x-1.5">
                    <span>Önceki: <strong className="text-gray-700">{comp.previousStock}</strong></span>
                    <span>→</span>
                    <span className="text-emerald-700 font-black bg-emerald-100 px-1.5 py-0.2 rounded">
                      Yeni Stok: {comp.newStock} {comp.unit}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-600 text-white p-1.5 rounded-lg shrink-0">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onDetected={handleScanDetected}
          onScan={handleScanDetected}
          onClose={() => {
            setShowScanner(false);
            cleanupBodyAndFocus();
          }}
          title="Stok Girişi Barkod Tara"
          description="Stoğunu eklemek istediğiniz ürünün barkodunu kamera çerçevesine hizalayın."
        />
      )}
    </div>
  );
};
