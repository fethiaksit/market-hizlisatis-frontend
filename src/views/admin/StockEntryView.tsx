import React, { useState, useEffect, useRef } from 'react';
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
  Minus
} from 'lucide-react';

interface StockEntryItem {
  product: Product;
  quantityToAdd: number;
  note: string;
}

export const StockEntryView: React.FC = () => {
  const { cashier } = useAuth();
  
  const [barcodeInput, setBarcodeInput] = useState('');
  const [entries, setEntries] = useState<StockEntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const processBarcode = async (barcode: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!barcode.trim()) return;

    const trimmed = barcode.trim();
    setBarcodeInput('');
    inputRef.current?.focus();

    // Check if already in the list
    const existingIndex = entries.findIndex(item => item.product.barcode.toLowerCase() === trimmed.toLowerCase());
    if (existingIndex >= 0) {
      const newEntries = [...entries];
      newEntries[existingIndex].quantityToAdd += 1;
      setEntries(newEntries);
      return;
    }

    try {
      const products = await posService.getAdminProducts(trimmed, false, cashier?.role);
      const product = products.find(p => p.barcode.toLowerCase() === trimmed.toLowerCase());

      if (product) {
        setEntries(prev => [{ product, quantityToAdd: 1, note: 'Manuel stok girişi' }, ...prev]);
      } else {
        setErrorMsg(`Barkod bulunamadı: ${trimmed}`);
      }
    } catch {
      setErrorMsg('Ürün aranırken hata oluştu.');
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processBarcode(barcodeInput);
  };

  const handleScanDetected = async (barcode: string) => {
    setShowScanner(false);
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

  const handleSaveAll = async () => {
    if (entries.length === 0) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const payload = entries.map(e => ({
        productId: e.product.id,
        quantity: e.quantityToAdd,
        note: e.note
      }));
      
      await posService.bulkStockEntry(payload, cashier?.name || 'Admin', cashier?.role);
      setSuccessMsg(`${entries.length} kalem ürün için stok girişi başarıyla tamamlandı.`);
      setEntries([]);
      inputRef.current?.focus();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Stok kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-zeytin-600" />
            <span>Stok Girişi</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Barkod okutarak listeye ekleyin ve tümünü kaydedin.</p>
        </div>

        {entries.length > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white rounded-xl flex items-center justify-center space-x-2 shadow-md transition-colors cursor-pointer min-h-[44px] ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Kaydediliyor...' : `TÜMÜNÜ KAYDET (${entries.length})`}</span>
          </button>
        )}
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

      {/* Barcode Input & Camera Section */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-xs border border-gray-100 shrink-0">
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="block w-full pl-11 pr-3 py-2.5 sm:py-3 text-base sm:text-base border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:border-zeytin-500 transition-colors font-mono"
              placeholder="Ürün barkodunu okutun..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Camera Scanner Button */}
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="min-h-[44px] min-w-[44px] p-2.5 sm:px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title="Kamera ile Barkod Okut"
          >
            <Camera className="w-5 h-5" />
            <span className="hidden md:inline ml-1.5 text-xs font-bold">Kamera</span>
          </button>

          <button
            type="submit"
            disabled={!barcodeInput.trim() || loading}
            className="min-h-[44px] bg-zeytin-600 hover:bg-zeytin-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center space-x-1.5 transition-colors shrink-0 text-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Listeye Ekle</span>
          </button>
        </form>
      </div>

      {/* Entries List Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-gray-700 text-sm">Eklenecek Ürünler ({entries.length})</h3>
          
          <button
            onClick={handleSaveAll}
            disabled={entries.length === 0 || loading}
            className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer min-h-[36px] ${
              entries.length === 0 || loading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? 'Kaydediliyor...' : 'KAYDET'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-gray-400 space-y-2 p-8">
              <Boxes className="w-14 h-14 opacity-20" />
              <p className="font-medium text-sm text-center">Stok girişi yapılacak ürünleri barkod okutarak veya kamera ile ekleyin.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-gray-100">
                {entries.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 leading-snug">{item.product.name}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">{item.product.barcode}</div>
                      </div>
                      <button
                        onClick={() => handleRemove(index)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Listeden Çıkar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-600">
                        <span>Mevcut: </span>
                        <span className="font-bold text-gray-900">{item.product.stock} {item.product.unit}</span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStepQuantity(index, -1)}
                          className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center text-lg active:scale-95 shadow-xs cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantityToAdd}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-14 text-center py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zeytin-500 focus:outline-none font-bold text-base bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepQuantity(index, 1)}
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
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Barkod / Ürün</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Mevcut Stok</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Eklenecek Miktar</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Not / Açıklama</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Sil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((item, index) => (
                      <tr key={`${item.product.id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{item.product.name}</div>
                          <div className="text-xs font-mono text-gray-500 mt-0.5">{item.product.barcode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                            {item.product.stock} {item.product.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleStepQuantity(index, -1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantityToAdd}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-20 text-center px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zeytin-500 focus:outline-none font-bold text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleStepQuantity(index, 1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.note}
                            onChange={(e) => handleNoteChange(index, e.target.value)}
                            placeholder="Açıklama..."
                            className="w-full px-3 py-1.5 border border-transparent hover:border-gray-300 focus:border-gray-300 rounded-lg bg-transparent focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-sm transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleRemove(index)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Listeden Çıkar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScanDetected}
          onClose={() => setShowScanner(false)}
          title="Stok Girişi Barkod Tara"
          description="Stoğunu eklemek istediğiniz ürünün barkodunu kamera çerçevesine hizalayın."
        />
      )}
    </div>
  );
};
