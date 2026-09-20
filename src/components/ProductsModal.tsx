import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { Product } from '../types/pos';
import { formatCurrency } from '../utils/format';
import { Search, X, Plus, Package, Layers } from 'lucide-react';

export const ProductsModal: React.FC = () => {
  const { isProductsModalOpen, setProductsModalOpen, products, addToCart } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TÜMÜ');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['TÜMÜ', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'TÜMÜ' || p.category === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleSelectProduct = (product: Product) => {
    addToCart(product, 1);
  };

  if (!isProductsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-zeytin-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-zeytin-300" />
            <h2 className="text-xl font-black tracking-wide">ÜRÜNLER KATALOĞU</h2>
            <span className="bg-zeytin-900 text-zeytin-200 text-xs px-2.5 py-1 rounded-full font-bold">
              {products.length} Ürün
            </span>
          </div>

          <button
            type="button"
            onClick={() => setProductsModalOpen(false)}
            className="p-2 rounded-xl bg-zeytin-700/60 hover:bg-zeytin-700 text-white transition-colors cursor-pointer"
            title="Kapat (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün adı veya barkod ile filtreleyin..."
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 focus:border-zeytin-600 rounded-xl text-base font-bold text-gray-900 placeholder-gray-400 focus:outline-none shadow-xs"
            />
          </div>

          {/* Quick Categories filter */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-gray-400 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-zeytin-700 text-white shadow-xs'
                      : 'bg-white hover:bg-gray-200 text-gray-600 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="font-bold text-base text-gray-600">Aranan kriterde ürün bulunamadı</p>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProduct(p)}
                className="group p-3 bg-white hover:bg-zeytin-50 border-2 border-gray-100 hover:border-zeytin-500 rounded-2xl text-left transition-all shadow-xs hover:shadow-md flex flex-col justify-between h-28 cursor-pointer relative"
              >
                <div>
                  <span className="text-[10px] font-mono text-gray-400 group-hover:text-zeytin-700 block mb-0.5">
                    {p.barcode}
                  </span>
                  <div className="font-bold text-gray-900 group-hover:text-zeytin-900 text-sm line-clamp-2 leading-snug">
                    {p.name}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 group-hover:border-zeytin-200">
                  <span className="text-base font-black text-zeytin-700">
                    {formatCurrency(p.price)}
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-zeytin-600 group-hover:text-white flex items-center justify-center text-gray-500 transition-colors">
                    <Plus className="w-4 h-4" />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>İstediğiniz ürüne tıklayarak mevcut sepete ekleyebilirsiniz.</span>
          <button
            type="button"
            onClick={() => setProductsModalOpen(false)}
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Tamam (Kapat)
          </button>
        </div>
      </div>
    </div>
  );
};
