import React from 'react';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { Plus, Minus, Trash2, ShoppingCart, RotateCcw } from 'lucide-react';

interface CartTableProps {
  onItemUpdated?: () => void;
}

export const CartTable: React.FC<CartTableProps> = ({ onItemUpdated }) => {
  const {
    currentKasa,
    itemsCount,
    updateQuantity,
    removeFromCart,
    clearCurrentCart,
  } = usePos();

  const handleQtyChange = (productId: string | number, currentQty: number, delta: number) => {
    const nextQty = currentQty + delta;
    updateQuantity(productId, nextQty);
    onItemUpdated?.();
  };

  const handleClear = () => {
    if (currentKasa.items.length === 0) return;
    if (window.confirm('Bu kasadaki tüm ürünleri silmek istediğinize emin misiniz?')) {
      clearCurrentCart();
      onItemUpdated?.();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
      {/* Table Header / Action Bar */}
      <div className="bg-gray-50/90 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-zeytin-700" />
          <span className="font-extrabold text-gray-800 text-xs sm:text-sm">
            {currentKasa.name} Sepeti
          </span>
          <span className="bg-zeytin-100 text-zeytin-800 text-[11px] px-2 py-0.2 rounded-full font-bold">
            {itemsCount} Kalem / Adet
          </span>
        </div>

        {currentKasa.items.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            title="Sepeti Boşalt"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Sepeti Boşalt</span>
          </button>
        )}
      </div>

      {/* Cart Items List with self-contained overflow-y: auto */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 p-1.5 space-y-1">
        {currentKasa.items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 text-gray-300">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-600">Sepet Boş</p>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs">
              Barkod okutarak veya hızlı ürün seçerek satışa başlayın.
            </p>
          </div>
        ) : (
          currentKasa.items.map((item) => (
            <div
              key={item.product.id}
              className="p-1.5 rounded-lg hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-2 border border-transparent hover:border-gray-200"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-xs sm:text-sm leading-tight truncate">
                  {item.product.name}
                </div>
                <div className="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
                  <span>{formatCurrency(item.unitPrice)}</span>
                  <span className="text-gray-300">•</span>
                  <span className="font-mono text-[10px] text-gray-400">{item.product.barcode}</span>
                </div>
              </div>

              {/* Quantity Controls (- QTY +) */}
              <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQtyChange(item.product.id, item.quantity, -1)}
                  className="w-6 h-6 rounded bg-white hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-gray-800 font-bold shadow-2xs transition-transform active:scale-95 cursor-pointer"
                  title="Azalt"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span className="w-7 text-center font-black text-xs text-gray-900">
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => handleQtyChange(item.product.id, item.quantity, 1)}
                  className="w-6 h-6 rounded bg-white hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-gray-800 font-bold shadow-2xs transition-transform active:scale-95 cursor-pointer"
                  title="Artır"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Line Total */}
              <div className="w-20 text-right shrink-0">
                <span className="font-black text-xs sm:text-sm text-gray-900">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => {
                  removeFromCart(item.product.id);
                  onItemUpdated?.();
                }}
                className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer shrink-0"
                title="Ürünü Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
