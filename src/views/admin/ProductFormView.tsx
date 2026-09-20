import React, { useState, useEffect } from 'react';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { 
  PackagePlus,
  Save,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Props {
  productId: string | number | null;
  onClose: () => void;
}

export const ProductFormView: React.FC<Props> = ({ productId, onClose }) => {
  const { cashier } = useAuth();
  const isEditing = !!productId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    price: '',
    purchasePrice: '',
    stock: '0',
    unit: 'Adet',
    category: ''
  });

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    setInitialLoading(true);
    try {
      const products = await posService.getAdminProducts('', true, cashier?.role);
      const product = products.find(p => String(p.id) === String(productId));
      if (product) {
        setFormData({
          barcode: product.barcode,
          name: product.name,
          price: product.price.toString(),
          purchasePrice: product.purchasePrice ? product.purchasePrice.toString() : '',
          stock: product.stock.toString(),
          unit: product.unit,
          category: product.category || ''
        });
      } else {
        setError('Düzenlenecek ürün bulunamadı.');
      }
    } catch (err) {
      setError('Ürün bilgileri yüklenemedi.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.barcode.trim()) {
      setError('Barkod alanı zorunludur.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Ürün adı alanı zorunludur.');
      return;
    }
    const priceNum = parseFloat(formData.price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Geçerli bir satış fiyatı giriniz.');
      return;
    }
    
    let purchasePriceNum: number | undefined;
    if (formData.purchasePrice.trim()) {
      purchasePriceNum = parseFloat(formData.purchasePrice.replace(',', '.'));
      if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
        setError('Geçerli bir alış fiyatı giriniz.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditing) {
        await posService.updateProduct(
          productId!,
          {
            name: formData.name,
            price: priceNum,
            purchasePrice: purchasePriceNum,
            unit: formData.unit,
            category: formData.category
          },
          cashier?.name || 'Admin',
          cashier?.role
        );
      } else {
        const stockNum = parseInt(formData.stock, 10);
        await posService.createProduct(
          {
            barcode: formData.barcode,
            name: formData.name,
            price: priceNum,
            purchasePrice: purchasePriceNum,
            stock: isNaN(stockNum) ? 0 : stockNum,
            unit: formData.unit,
            category: formData.category
          },
          cashier?.name || 'Admin',
          cashier?.role
        );
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-6">Ürün bilgileri yükleniyor...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center space-x-2">
            <PackagePlus className="w-6 h-6 text-zeytin-600" />
            <span>{isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Mevcut ürünün bilgilerini güncelleyin.' : 'Kataloğa yeni bir ürün ekleyin.'}
          </p>
        </div>
        
        <button
          onClick={onClose}
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Barkod */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Barkod <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                disabled={isEditing} // Cannot change barcode once created
                placeholder="Örn: 8690000000000"
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none transition-colors ${
                  isEditing ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1 flex items-center">
                  <Info className="w-3 h-3 mr-1" /> Barkod değiştirilemez.
                </p>
              )}
            </div>

            {/* Ürün Adı */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Ürün Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Örn: Süzme Çiçek Balı 850g"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-zeytin-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Satış Fiyatı */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Satış Fiyatı (₺) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-zeytin-500 focus:outline-none transition-colors font-mono"
              />
            </div>

            {/* Alış Fiyatı */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Alış Fiyatı (₺) <span className="text-gray-400 font-normal">(Opsiyonel)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-zeytin-500 focus:outline-none transition-colors font-mono"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Kategori
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Örn: Şarküteri, İçecek..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-zeytin-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Birim */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Birim
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-zeytin-500 focus:outline-none transition-colors"
              >
                <option value="Adet">Adet</option>
                <option value="Kg">Kg</option>
                <option value="Paket">Paket</option>
                <option value="Koli">Koli</option>
                <option value="Litre">Litre</option>
              </select>
            </div>

            {/* Başlangıç Stoku (Sadece yeni eklemede) */}
            {!isEditing && (
              <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Başlangıç Stoku
                </label>
                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors font-mono"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <Info className="w-4 h-4 mr-1 text-blue-500" />
                  0'dan büyük bir değer girerseniz otomatik olarak bir "Stok Girişi" (STOCK_IN) hareketi oluşturulur.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl flex items-center space-x-2 shadow-md transition-colors ${
              loading ? 'bg-zeytin-400 cursor-not-allowed' : 'bg-zeytin-600 hover:bg-zeytin-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
