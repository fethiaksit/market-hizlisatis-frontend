import React, { useState, useEffect } from 'react';
import { Category } from '../../types/pos';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { 
  PackagePlus,
  Save,
  X,
  AlertTriangle,
  Star,
  Image,
  Camera
} from 'lucide-react';
import { BarcodeScanner } from '../../components/BarcodeScanner';

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
  const [showScanner, setShowScanner] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    purchasePrice: '',
    price: '',
    stock: '0',
    unit: 'Adet',
    isQuickProduct: false,
    imageUrl: '',
  });

  useEffect(() => {
    const loadInitial = async () => {
      setInitialLoading(true);
      try {
        const categoryList = await posService.getCategories();
        setCategories(categoryList);
        if (isEditing) {
          await loadProduct();
        }
      } catch {
        setError('Kategori bilgileri yüklenemedi.');
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    try {
      const products = await posService.getAdminProducts('', true, cashier?.role);
      const product = products.find(p => String(p.id) === String(productId));
      if (product) {
        setFormData({
          name: product.name,
          barcode: product.barcode,
          category: product.category || '',
          purchasePrice: product.purchasePrice ? product.purchasePrice.toString() : '',
          price: product.price.toString(),
          stock: product.stock.toString(),
          unit: product.unit || 'Adet',
          isQuickProduct: Boolean(product.isQuickProduct),
          imageUrl: product.imageUrl || '',
        });
      } else {
        setError('Düzenlenecek ürün bulunamadı.');
      }
    } catch {
      setError('Ürün bilgileri yüklenemedi.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError(''); // Clear error on change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation in requested order
    if (!formData.name.trim()) {
      setError('Ürün adı alanı zorunludur.');
      return;
    }

    if (!formData.barcode.trim()) {
      setError('Barkod alanı zorunludur.');
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

    const priceNum = parseFloat(formData.price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Geçerli bir satış fiyatı giriniz.');
      return;
    }

    // Favori ürün görsel kuralı (Kesin Kural: Section 7 & 13)
    if (formData.isQuickProduct && !formData.imageUrl.trim()) {
      setError('Favori ürün için ürün görseli gereklidir.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await posService.updateProduct(
          productId!,
          {
            name: formData.name.trim(),
            barcode: formData.barcode.trim(),
            category: formData.category,
            purchasePrice: purchasePriceNum,
            price: priceNum,
            unit: formData.unit,
            imageUrl: formData.imageUrl.trim(),
            isQuickProduct: formData.isQuickProduct,
          },
          cashier?.name || 'Admin',
          cashier?.role
        );
      } else {
        const stockNum = parseInt(formData.stock, 10);
        await posService.createProduct(
          {
            name: formData.name.trim(),
            barcode: formData.barcode.trim(),
            category: formData.category,
            purchasePrice: purchasePriceNum,
            price: priceNum,
            stock: isNaN(stockNum) ? 0 : stockNum,
            unit: formData.unit,
            imageUrl: formData.imageUrl.trim(),
            isQuickProduct: formData.isQuickProduct,
          },
          cashier?.name || 'Admin',
          cashier?.role
        );
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kaydetme işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full text-gray-500">
        Ürün bilgileri yükleniyor...
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-zeytin-100 p-2.5 rounded-xl text-zeytin-700">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800">
              {isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {isEditing ? 'Mevcut ürün bilgilerini güncelleyin.' : 'Kataloğa yeni bir ürün tanımlayın.'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-gray-100 space-y-4">
        {/* Mobile Single Column Form (Order as requested: Name -> Barcode -> Category -> Purchase Price -> Sale Price -> Stock -> Unit -> Favorite -> Image -> Save) */}
        
        {/* 1. Ürün Adı */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
            Ürün Adı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Örn: Ülker Çikolatalı Gofret"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm font-semibold transition-colors bg-gray-50 focus:bg-white"
            autoFocus
          />
        </div>

        {/* 2. Barkod */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
            Barkod <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              placeholder="Örn: 869000100001"
              className="flex-1 min-w-0 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm font-mono font-bold transition-colors bg-gray-50 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="shrink-0 min-h-[46px] min-w-[46px] px-3.5 bg-zeytin-600 hover:bg-zeytin-500 active:bg-zeytin-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer font-bold text-xs"
              title="Kamera ile Barkod Oku"
              aria-label="Kamera ile Barkod Oku"
            >
              <Camera className="w-5 h-5" />
              <span className="hidden sm:inline">Kamera</span>
            </button>
          </div>
        </div>

        {/* 3. Kategori */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
            Kategori
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm font-semibold transition-colors bg-gray-50 focus:bg-white"
          >
            <option value="">Kategori Seçiniz</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Satış Fiyatı & 5. Alış Fiyatı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Satış Fiyatı (₺) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm font-black text-zeytin-800 transition-colors bg-gray-50 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Alış Fiyatı (₺) <span className="text-gray-400 font-normal">(Opsiyonel)</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm font-bold transition-colors bg-gray-50 focus:bg-white font-mono"
            />
          </div>
        </div>

        {/* 6. Stok & Birim */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              {isEditing ? 'Mevcut Stok (Stok girişinden değiştirilir)' : 'Başlangıç Stoğu'}
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              disabled={isEditing}
              min="0"
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm font-bold transition-colors ${
                isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 focus:bg-white'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Birim
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm font-semibold transition-colors bg-gray-50 focus:bg-white"
            >
              <option value="Adet">Adet</option>
              <option value="Kg">Kg</option>
              <option value="Paket">Paket</option>
              <option value="Koli">Koli</option>
              <option value="Litre">Litre</option>
            </select>
          </div>
        </div>

        {/* 7. Favori Ürün Seçimi */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-gray-900 block">
                Favori Ürün (Hızlı Satış Butonları)
              </span>
              <span className="text-[11px] text-amber-900 font-medium">
                Seçilirse POS ekranında hızlı satış butonlarında görünür.
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              name="isQuickProduct"
              checked={formData.isQuickProduct}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* 8. Ürün Görseli / Görsel URL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Ürün Görseli / Görsel URL {formData.isQuickProduct && <span className="text-red-500 font-bold">* (Favori için zorunlu)</span>}
            </label>
            {formData.isQuickProduct && (
              <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                Favori için görsel zorunludur
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="https://... veya server görsel yolu"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none text-base sm:text-sm transition-colors bg-gray-50 focus:bg-white"
            />

            {/* Live image preview */}
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {formData.imageUrl.trim() ? (
                <img 
                  src={formData.imageUrl.trim()} 
                  alt="Önizleme"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Image className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Ürün görsel URL'si girildiğinde kalıcı olarak kaydedilir ve POS ekranında gösterilir.
          </p>
        </div>

        {/* 9. Büyük Kaydet Butonu */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer min-h-[48px]"
          >
            Vazgeç
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-zeytin-600 hover:bg-zeytin-700 active:bg-zeytin-800 disabled:opacity-50 text-white font-black text-sm sm:text-base rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer min-h-[48px]"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Kaydediliyor...' : isEditing ? 'Değişiklikleri Kaydet' : 'Ürünü Kaydet'}</span>
          </button>
        </div>
      </form>

      {/* Kamera Barkod Okuyucu Modalı */}
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onDetected={(barcode) => {
            setFormData((prev) => ({
              ...prev,
              barcode: barcode.trim(),
            }));
            setShowScanner(false);
          }}
          title="BARKOD OKUTUN"
          description="Ürün barkodunu kameraya gösterin"
        />
      )}
    </div>
  );
};
