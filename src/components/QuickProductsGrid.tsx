import React from 'react';
import { usePos } from '../context/PosContext';
import { Product } from '../types/pos';
import { formatCurrency } from '../utils/format';
import { Zap } from 'lucide-react';

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
    <div className="bg-white rounded-xl p-2.5 border border-gray-200 shadow-2xs">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center space-x-1 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Hızlı Ürünler (10 Ana Ürün)</span>
        </div>
        <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
          Tek dokunuşla sepete ekle
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {quickProducts.map((product, idx) => (
          <button
            key={product.id}
            type="button"
            onClick={() => handleQuickAdd(product)}
            className="group p-2 bg-gradient-to-b from-gray-50 to-white hover:from-zeytin-50 hover:to-zeytin-100/40 active:scale-[0.98] border border-gray-200 hover:border-zeytin-400 rounded-lg text-left transition-all duration-100 flex flex-col justify-between h-14 shadow-2xs cursor-pointer relative overflow-hidden"
          >
            {/* Number badge */}
            <span className="absolute top-1 right-1.5 text-[9px] font-bold text-gray-300 group-hover:text-zeytin-600">
              #{idx + 1}
            </span>

            {/* Product Name */}
            <div className="font-bold text-gray-800 group-hover:text-zeytin-900 text-xs line-clamp-1 leading-tight pr-3">
              {product.name}
            </div>

            {/* Price & Unit */}
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-xs font-black text-zeytin-700 group-hover:text-zeytin-800">
                {formatCurrency(product.price)}
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                {product.unit}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
