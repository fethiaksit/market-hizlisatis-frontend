import React, { useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { Product } from '../types/pos';
import { formatCurrency } from '../utils/format';
import { ImageIcon } from 'lucide-react';

interface QuickProductsGridProps {
  onProductClick?: () => void;
}

export const QuickProductsGrid: React.FC<QuickProductsGridProps> = ({ onProductClick }) => {
  const { quickProducts, addToCart, showToast } = usePos();

  // UI tarafında ikinci bir güvenlik katmanı:
  // sadece aktif favori + görseli olan ürünler resimli hızlı satış alanında gösterilir.
  // Böylece eski kısayol/shortcut kartlarına veya görselsiz ürünlere geri düşülmez.
  const favoriteProducts = useMemo(
    () =>
      (quickProducts || []).filter(
        product =>
          product.isQuickProduct &&
          product.isActive !== false &&
          Boolean(product.imageUrl?.trim())
      ),
    [quickProducts]
  );

  const handleQuickAdd = (product: Product) => {
    if (product.stock <= 0) {
      showToast('Ürün stokta yok.', 'error');
      return;
    }

    addToCart(product, 1);
    onProductClick?.();
  };

  return (
    <section
      aria-label="Favori ürünler"
      className="bg-white rounded-xl p-2 sm:p-2.5 border border-gray-200 shadow-2xs"
    >
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center space-x-1.5 text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
          <ImageIcon className="w-3.5 h-3.5 text-zeytin-600" />
          <span>Favori Ürünler</span>
        </div>
        <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
          Resme dokun, sepete ekle
        </span>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-5 text-center">
          <p className="text-sm font-semibold text-gray-600">Henüz favori ürün eklenmemiş.</p>
          <p className="mt-1 text-xs text-gray-400">
            Admin panelinden görseli olan bir ürünü favoriye ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {favoriteProducts.map(product => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleQuickAdd(product)}
              aria-label={`${product.name} sepete ekle`}
              className="group min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-2xs transition-all duration-100 hover:-translate-y-0.5 hover:border-zeytin-400 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>

              <div className="min-w-0 p-2 sm:p-2.5">
                <div className="truncate text-xs font-bold leading-snug text-gray-900 group-hover:text-zeytin-900 sm:text-sm">
                  {product.name}
                </div>

                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="text-sm font-black text-zeytin-700 group-hover:text-zeytin-800 sm:text-base">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="shrink-0 text-[10px] font-medium text-gray-400">
                    {product.stock > 0 ? product.unit : 'Stok yok'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
