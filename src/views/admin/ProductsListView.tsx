import React, { useState, useEffect } from 'react';
import { Product } from '../../types/pos';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { 
  Search, 
  Plus, 
  Edit, 
  Power, 
  PowerOff,
  PackageSearch,
  Filter,
  Star,
  Camera,
  X,
  Package,
  CheckCircle
} from 'lucide-react';

interface Props {
  onEditProduct: (id: string | number) => void;
  onNewProduct: () => void;
}

export const ProductsListView: React.FC<Props> = ({ onEditProduct, onNewProduct }) => {
  const { cashier } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Admin camera barcode search state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const showInactive = filterActive !== 'ACTIVE';
      const data = await posService.getAdminProducts('', showInactive, cashier?.role);
      
      let filtered = data;
      if (filterActive === 'ACTIVE') {
        filtered = data.filter(p => p.isActive !== false);
      } else if (filterActive === 'INACTIVE') {
        filtered = data.filter(p => p.isActive === false);
      }
      
      setProducts(filtered);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (product: Product) => {
    try {
      await posService.setProductFavorite(product.id, !product.isQuickProduct, cashier?.role);
      await loadProducts();
      if (scannedProduct && String(scannedProduct.id) === String(product.id)) {
        setScannedProduct(prev => prev ? { ...prev, isQuickProduct: !prev.isQuickProduct } : null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleToggleActive = async (id: string | number) => {
    try {
      await posService.toggleProductActive(id, cashier?.name || 'Admin', cashier?.role);
      await loadProducts();
      if (scannedProduct && String(scannedProduct.id) === String(id)) {
        setScannedProduct(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      }
    } catch (err) {
      alert('Ürün durumu değiştirilemedi: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Admin Camera Scan handler (Does NOT add to cart; finds product and opens detail card)
  const handleAdminCameraScan = async (barcode: string) => {
    if (!barcode) return;
    try {
      const prod = await posService.findProductByBarcode(barcode);
      if (prod) {
        setScannedProduct(prod);
      } else {
        alert('Bu barkoda ait ürün bulunamadı.');
      }
    } catch {
      alert('Bu barkoda ait ürün bulunamadı.');
    }
  };

  const displayProducts = products.filter(p => 
    searchQuery === '' || 
    p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center space-x-2">
            <PackageSearch className="w-6 h-6 text-zeytin-600" />
            <span>Ürün Listesi</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Sistemdeki tüm ürünleri görüntüleyin, arayın ve yönetin.
          </p>
        </div>
        
        <button
          onClick={onNewProduct}
          className="bg-zeytin-600 hover:bg-zeytin-700 active:bg-zeytin-800 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      {/* Filters, Search & Admin Camera Button */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row gap-2.5 sm:gap-4 mb-4 shrink-0">
        <div className="flex-1 flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:border-zeytin-500 text-base sm:text-sm transition-colors"
              placeholder="Barkod veya ürün adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Admin Camera Barcode Scanner Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-sm transition-colors shrink-0 cursor-pointer min-h-[44px]"
            title="Kamera ile Barkod Okutarak Ürün Bul"
          >
            <Camera className="w-4.5 h-4.5" />
            <span className="hidden xs:inline">Kamera</span>
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-xl p-1 shrink-0 overflow-x-auto">
          <div className="pl-2 pr-1 text-gray-400">
            <Filter className="w-4 h-4" />
          </div>
          <button
            onClick={() => setFilterActive('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer min-h-[36px] ${filterActive === 'ALL' ? 'bg-white shadow-xs text-zeytin-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilterActive('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer min-h-[36px] ${filterActive === 'ACTIVE' ? 'bg-white shadow-xs text-zeytin-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Aktif
          </button>
          <button
            onClick={() => setFilterActive('INACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer min-h-[36px] ${filterActive === 'INACTIVE' ? 'bg-white shadow-xs text-zeytin-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pasif
          </button>
        </div>
      </div>

      {/* Camera Scanner Component for Admin */}
      <BarcodeScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleAdminCameraScan}
        title="YÖNETİCİ BARKOD ARAMA"
        description="Ürünü bulmak için barkodu okutun"
      />

      {/* Admin Scanned Product Detail Card Modal */}
      {scannedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-zeytin-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm tracking-wide">Ürün Bulundu</h3>
              </div>
              <button
                type="button"
                onClick={() => setScannedProduct(null)}
                className="p-1 rounded-lg bg-zeytin-800 hover:bg-zeytin-700 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {scannedProduct.imageUrl ? (
                    <img 
                      src={scannedProduct.imageUrl} 
                      alt={scannedProduct.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-base text-gray-900 leading-tight">
                    {scannedProduct.name}
                  </h4>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">
                    Barkod: {scannedProduct.barcode}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded">
                      {scannedProduct.category || 'Kategorisiz'}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded">
                      {scannedProduct.unit}
                    </span>
                    {scannedProduct.isQuickProduct && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Favori
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Stock Badges */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-center">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Satış</span>
                  <span className="text-sm font-black text-zeytin-700">
                    {formatCurrency(scannedProduct.price)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Alış</span>
                  <span className="text-sm font-bold text-gray-700">
                    {scannedProduct.purchasePrice ? formatCurrency(scannedProduct.purchasePrice) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Stok</span>
                  <span className={`text-sm font-black ${
                    scannedProduct.stock <= 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    {scannedProduct.stock} {scannedProduct.unit}
                  </span>
                </div>
              </div>

              {/* Action Buttons in Scanned Card */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const id = scannedProduct.id;
                    setScannedProduct(null);
                    onEditProduct(id);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <Edit className="w-4 h-4" />
                  <span>Düzenle</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleFavorite(scannedProduct)}
                  className={`font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer min-h-[44px] ${
                    scannedProduct.isQuickProduct
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Star className={`w-4 h-4 ${scannedProduct.isQuickProduct ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{scannedProduct.isQuickProduct ? 'Favoriden Çıkar' : 'Favoriye Ekle'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Content Container */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
        {/* A. Mobile View: Card List (md:hidden) */}
        <div className="md:hidden flex-1 overflow-y-auto p-2.5 space-y-2 divide-y divide-gray-100 min-h-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
          ) : displayProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">Ürün bulunamadı.</div>
          ) : (
            displayProducts.map((product) => (
              <div 
                key={product.id} 
                className={`pt-2.5 first:pt-0 flex flex-col space-y-2 p-2 rounded-xl transition-colors ${
                  product.isActive === false ? 'bg-red-50/40 border border-red-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-sm text-gray-900 line-clamp-1 leading-snug">
                        {product.name}
                      </div>
                      <div className="text-[11px] font-mono text-gray-500 mt-0.5">
                        Barkod: {product.barcode}
                      </div>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    product.stock <= 0 ? 'bg-red-100 text-red-800' : 
                    product.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                  }`}>
                    Stok: {product.stock}
                  </span>
                </div>

                {/* Price and Details Row */}
                <div className="flex items-center justify-between text-xs bg-gray-50/80 px-2.5 py-1.5 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Satış</span>
                      <span className="font-black text-zeytin-700">{formatCurrency(product.price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Alış</span>
                      <span className="font-semibold text-gray-600">
                        {product.purchasePrice ? formatCurrency(product.purchasePrice) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(product)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                        product.isQuickProduct
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
                      }`}
                      title="Favori"
                    >
                      <Star className={`w-4 h-4 ${product.isQuickProduct ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditProduct(product.id)}
                      className="p-2 text-blue-600 bg-blue-50 active:bg-blue-100 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(product.id)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                        product.isActive !== false ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'
                      }`}
                      title={product.isActive !== false ? "Pasife Al" : "Aktife Al"}
                    >
                      {product.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* B. Desktop View: Full Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Barkod
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ürün Adı
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Satış Fiyatı
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Alış Fiyatı
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">Yükleniyor...</td>
                </tr>
              ) : displayProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500 font-medium">
                    Ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                displayProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${product.isActive === false ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {product.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.category || 'Kategorisiz'} • {product.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zeytin-700">
                      {product.price.toFixed(2)} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.purchasePrice ? `${product.purchasePrice.toFixed(2)} ₺` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        product.stock <= 0 ? 'bg-red-100 text-red-800' : 
                        product.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {product.isActive !== false ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleFavorite(product)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            product.isQuickProduct
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                          title={product.isQuickProduct ? 'Favoriden Çıkar' : 'Favoriye Ekle'}
                        >
                          <Star className={`w-4 h-4 ${product.isQuickProduct ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={() => onEditProduct(product.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(product.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            product.isActive !== false 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={product.isActive !== false ? "Pasife Al" : "Aktife Al"}
                        >
                          {product.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 text-xs text-gray-500 font-medium shrink-0 flex items-center justify-between">
          <span>Toplam {displayProducts.length} ürün listeleniyor.</span>
          <span className="hidden sm:inline">Admin Barkod Okuma: Ürün arama kutusu yanındaki Kamera butonunu kullanabilirsiniz.</span>
        </div>
      </div>
    </div>
  );
};
