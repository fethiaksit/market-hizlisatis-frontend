import React from 'react';
import { usePos } from '../context/PosContext';
import { Product } from '../types/pos';
import { formatCurrency } from '../utils/format';
import { Zap, Package } from 'lucide-react';

interface QuickProductsGridProps {
  onProductClick?: () => void;
}

export const QuickProductsGrid: React.FC<QuickProductsGridProps> = ({ onProductClick }) => {
  const { quickProducts, addToCart } = usePos();

  const handleQuickAdd = (product: Product) => {
    addToCart(product, 1);
    onProductClick?.();
  };

  if (!quickProducts || quickProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-2 sm:p-2.5 border border-gray-200 shadow-2xs">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center space-x-1 text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Favori Ürünler (Hızlı Satış)</span>
        </div>
        <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
          Tek dokunuşla sepete ekle
        </span>
      </div>

      {/* Grid: 2-3 cols on mobile, 3-4 cols on tablet, 5 cols on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2">
        {quickProducts.map((product, idx) => (
          <button
            key={product.id}
            type="button"
            onClick={() => handleQuickAdd(product)}
            className="group p-2 bg-gradient-to-b from-gray-50 to-white hover:from-zeytin-50 hover:to-zeytin-100/40 active:scale-[0.98] border border-gray-200 hover:border-zeytin-400 rounded-xl text-left transition-all duration-100 flex items-center gap-2 min-h-[58px] shadow-2xs cursor-pointer relative overflow-hidden"
          >
            {/* Number badge */}
            <span className="absolute top-1 right-1.5 text-[9px] font-bold text-gray-300 group-hover:text-zeytin-600">
              #{idx + 1}
            </span>

            {/* Thumbnail Image with lazy load */}
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Package className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Product Details */}
            <div className="min-w-0 flex-1 pr-2">
              <div className="font-bold text-gray-900 group-hover:text-zeytin-900 text-xs line-clamp-1 leading-snug">
                {product.name}
              </div>

              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs font-black text-zeytin-700 group-hover:text-zeytin-800">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-[9px] text-gray-400 font-medium">
                  {product.unit}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
