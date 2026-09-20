import React, { useState, useEffect } from 'react';
import { Product } from '../../types/pos';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Plus, 
  Edit, 
  Power, 
  PowerOff,
  PackageSearch,
  Filter,
  Star
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
    } catch (err) {
      alert('Favori durumu değiştirilemedi: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleToggleActive = async (id: string | number) => {
    try {
      await posService.toggleProductActive(id, cashier?.name || 'Admin', cashier?.role);
      loadProducts();
    } catch (err) {
      alert('Ürün durumu değiştirilemedi: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const displayProducts = products.filter(p => 
    searchQuery === '' || 
    p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center space-x-2">
            <PackageSearch className="w-6 h-6 text-zeytin-600" />
            <span>Ürün Listesi</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Sistemdeki tüm ürünleri görüntüleyin ve yönetin.</p>
        </div>
        
        <button
          onClick={onNewProduct}
          className="bg-zeytin-600 hover:bg-zeytin-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row gap-4 mb-4 shrink-0">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-zeytin-500 focus:border-zeytin-500 sm:text-sm transition-colors"
            placeholder="Barkod veya ürün adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl p-1 shrink-0">
          <div className="pl-2 pr-1 text-gray-400">
            <Filter className="w-4 h-4" />
          </div>
          <button
            onClick={() => setFilterActive('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filterActive === 'ALL' ? 'bg-white shadow-xs text-zeytin-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilterActive('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filterActive === 'ACTIVE' ? 'bg-white shadow-xs text-zeytin-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Aktif
          </button>
          <button
            onClick={() => setFilterActive('INACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filterActive === 'INACTIVE' ? 'bg-white shadow-xs text-zeytin-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pasif
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
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
                      <div className="text-sm font-bold text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.category || 'Kategorisiz'} • {product.unit}</div>
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
                          className={`p-1.5 rounded-lg transition-colors ${
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
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(product.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
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
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-xs text-gray-500 font-medium shrink-0">
          Toplam {displayProducts.length} ürün listeleniyor.
        </div>
      </div>
    </div>
  );
};
