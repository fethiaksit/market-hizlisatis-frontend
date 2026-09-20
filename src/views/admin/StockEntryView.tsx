import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types/pos';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { 
  Boxes,
  Search,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle
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
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!barcodeInput.trim()) return;

    const barcode = barcodeInput.trim();
    setBarcodeInput('');
    inputRef.current?.focus();

    // Check if already in the list
    const existingIndex = entries.findIndex(item => item.product.barcode.toLowerCase() === barcode.toLowerCase());
    if (existingIndex >= 0) {
      const newEntries = [...entries];
      newEntries[existingIndex].quantityToAdd += 1;
      setEntries(newEntries);
      return;
    }

    try {
      // Find product by barcode via posService
      // Note: We use getAdminProducts to also find inactive products or just active.
      // Usually, we shouldn't add stock to inactive products, but let's allow it if needed, or filter.
      const products = await posService.getAdminProducts(barcode, false, cashier?.role);
      const product = products.find(p => p.barcode.toLowerCase() === barcode.toLowerCase());

      if (product) {
        setEntries(prev => [{ product, quantityToAdd: 1, note: 'Manuel stok girişi' }, ...prev]);
      } else {
        setErrorMsg(`Barkod bulunamadı: ${barcode}`);
      }
    } catch (err) {
      setErrorMsg('Ürün aranırken hata oluştu.');
    }
  };

  const handleQuantityChange = (index: number, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) return;
    
    const newEntries = [...entries];
    newEntries[index].quantityToAdd = num;
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
    <div className="p-6 h-full flex flex-col max-w-6xl mx-auto">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-black text-gray-800 flex items-center space-x-2">
          <Boxes className="w-6 h-6 text-zeytin-600" />
          <span>Stok Girişi</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Barkod okutarak listeye ekleyin ve tümünü kaydedin.</p>
      </div>

      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-start space-x-3 shrink-0">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start space-x-3 shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Barcode Input Section */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 mb-6 shrink-0">
        <form onSubmit={handleBarcodeSubmit} className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="block w-full pl-12 pr-4 py-3 text-lg border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:border-zeytin-500 transition-colors font-mono"
              placeholder="Ürün barkodunu okutun..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={!barcodeInput.trim() || loading}
            className="bg-zeytin-600 hover:bg-zeytin-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Listeye Ekle</span>
          </button>
        </form>
      </div>

      {/* Entries List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-gray-700">Eklenecek Ürünler ({entries.length})</h3>
          
          <button
            onClick={handleSaveAll}
            disabled={entries.length === 0 || loading}
            className={`px-5 py-2 text-sm font-bold text-white rounded-xl flex items-center space-x-2 shadow-md transition-colors ${
              entries.length === 0 || loading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Kaydediliyor...' : 'TÜMÜNÜ KAYDET'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {entries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 p-10">
              <Boxes className="w-16 h-16 opacity-20" />
              <p className="font-medium">Stok girişi yapılacak ürünleri barkod ile ekleyin.</p>
            </div>
          ) : (
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
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantityToAdd}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-24 text-center px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zeytin-500 focus:outline-none font-bold"
                        />
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
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Listeden Çıkar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
