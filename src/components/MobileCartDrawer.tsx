import React from 'react';
import { usePos } from '../context/PosContext';
import { formatCurrency } from '../utils/format';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  RotateCcw, 
  Banknote, 
  CreditCard, 
  UserCheck, 
  UserPlus, 
  CheckCircle2, 
  Loader2,
  Package
} from 'lucide-react';

interface MobileCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_CASH_AMOUNTS = [50, 100, 200, 500];

export const MobileCartDrawer: React.FC<MobileCartDrawerProps> = ({ isOpen, onClose }) => {
  const {
    currentKasa,
    totalAmount,
    changeAmount,
    itemsCount,
    setPaymentType,
    setReceivedAmount,
    quickAddReceivedAmount,
    completeSale,
    isSubmittingSale,
    updateQuantity,
    removeFromCart,
    clearCurrentCart,
    setCustomerModalOpen,
  } = usePos();

  if (!isOpen) return null;

  const isCash = currentKasa.paymentType === 'CASH';
  const isCard = currentKasa.paymentType === 'CARD';
  const isCredit = currentKasa.paymentType === 'CREDIT';
  const hasItems = currentKasa.items.length > 0;
  const selectedCustomer = currentKasa.customer;

  const handleQtyChange = (productId: string | number, currentQty: number, delta: number) => {
    const nextQty = currentQty + delta;
    updateQuantity(productId, nextQty);
  };

  const handleClear = () => {
    if (currentKasa.items.length === 0) return;
    if (window.confirm('Sepetteki tüm ürünleri silmek istediğinize emin misiniz?')) {
      clearCurrentCart();
    }
  };

  const handleCashInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setReceivedAmount(isNaN(val) ? 0 : val);
  };

  const handleExactCash = () => {
    setReceivedAmount(totalAmount);
  };

  const handleCompleteSale = async () => {
    const success = await completeSale();
    if (success) {
      onClose();
    }
  };

  const projectedNewBalance = selectedCustomer ? selectedCustomer.balance + totalAmount : totalAmount;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Drawer Container */}
      <div 
        className="bg-white rounded-t-3xl max-h-[92vh] flex flex-col w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="bg-zeytin-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-zeytin-300" />
            <div>
              <h3 className="font-black text-sm tracking-wide">
                {currentKasa.name} Sepeti
              </h3>
              <p className="text-[10px] text-zeytin-300 font-semibold">
                {itemsCount} Kalem / Adet Ürün
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasItems && (
              <button
                type="button"
                onClick={handleClear}
                className="text-red-300 hover:text-red-200 bg-red-950/60 hover:bg-red-900/60 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Sepeti Boşalt"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Boşalt</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zeytin-800 hover:bg-zeytin-700 text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Item Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-gray-100 min-h-0">
          {!hasItems ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <p className="font-bold text-gray-700 text-sm">Sepetiniz Boş</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Barkod okutarak veya favori ürünlere dokunarak sepete ürün ekleyin.
              </p>
            </div>
          ) : (
            currentKasa.items.map((item) => (
              <div 
                key={item.product.id}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2.5"
              >
                {/* Thumbnail Image */}
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {item.product.imageUrl ? (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback icon on error
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-1">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                    <span className="font-bold text-zeytin-700">{formatCurrency(item.unitPrice)}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-mono text-gray-400 text-[10px]">{item.product.barcode}</span>
                  </div>
                  <div className="text-xs font-black text-gray-900 mt-0.5">
                    Toplam: {formatCurrency(item.totalPrice)}
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center space-x-1 shrink-0">
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.product.id, item.quantity, -1)}
                      className="w-7 h-7 rounded-lg bg-white active:bg-gray-200 flex items-center justify-center text-gray-800 font-bold shadow-2xs transition-transform active:scale-95 cursor-pointer"
                      title="Azalt"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-7 text-center font-black text-xs text-gray-900">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.product.id, item.quantity, 1)}
                      className="w-7 h-7 rounded-lg bg-white active:bg-gray-200 flex items-center justify-center text-gray-800 font-bold shadow-2xs transition-transform active:scale-95 cursor-pointer"
                      title="Artır"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 active:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Area Pinned at Bottom */}
        <div className="bg-gray-50 border-t border-gray-200 p-3 space-y-2.5 shrink-0">
          {/* Total Amount Display Banner */}
          <div className="bg-gradient-to-r from-gray-900 to-zeytin-950 text-white px-4 py-2 rounded-2xl flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                ÖDENECEK TOPLAM TUTAR
              </span>
              <span className="text-xs text-zeytin-300 font-bold">
                {currentKasa.name} {selectedCustomer ? `• ${selectedCustomer.name}` : ''}
              </span>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-white drop-shadow-sm">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Switcher (3 Large Buttons) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType('CASH')}
              className={`py-2.5 px-2 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border-2 min-h-[44px] ${
                isCash
                  ? 'bg-zeytin-700 text-white border-zeytin-700 shadow-md ring-2 ring-zeytin-400'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>NAKİT</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType('CARD')}
              className={`py-2.5 px-2 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border-2 min-h-[44px] ${
                isCard
                  ? 'bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-400'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>KART</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType('CREDIT')}
              className={`py-2.5 px-2 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border-2 min-h-[44px] ${
                isCredit
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>CARİ</span>
            </button>
          </div>

          {/* Conditional Payment Details */}
          {isCash ? (
            <div className="space-y-1.5 bg-white p-2 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentKasa.receivedAmount || ''}
                    onChange={handleCashInputChange}
                    placeholder="Alınan ₺"
                    className="w-full bg-gray-50 border border-gray-300 focus:border-zeytin-600 rounded-xl px-3 py-2 text-right font-black text-base text-gray-900 focus:outline-none"
                  />
                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400 pointer-events-none">
                    Alınan
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExactCash}
                  disabled={!hasItems}
                  className="text-xs font-extrabold text-zeytin-800 bg-zeytin-100 hover:bg-zeytin-200 active:bg-zeytin-300 px-3 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap min-h-[44px]"
                >
                  Tam Tutar
                </button>
              </div>

              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                  {QUICK_CASH_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => quickAddReceivedAmount(amt)}
                      className="py-1 px-2.5 bg-gray-100 hover:bg-zeytin-50 border border-gray-200 hover:border-zeytin-400 rounded-lg text-xs font-black text-gray-800 transition-all cursor-pointer shrink-0"
                    >
                      {amt}₺
                    </button>
                  ))}
                </div>

                <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl px-3 py-1 text-right flex items-center space-x-1.5 shrink-0">
                  <span className="text-[10px] font-black uppercase">Para Üstü:</span>
                  <span className="text-sm font-black text-emerald-800">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            </div>
          ) : isCard ? (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl py-2.5 px-3 text-center flex items-center justify-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-extrabold text-blue-900 text-xs sm:text-sm">
                Banka POS Terminali Hazır
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5">
              {!selectedCustomer ? (
                <div className="flex items-center justify-between">
                  <span className="text-amber-900 text-xs font-bold">
                    ⚠️ Cari müşteri seçilmedi!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setCustomerModalOpen(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer min-h-[38px]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Cari Seç</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-amber-900 font-bold block">{selectedCustomer.name}</span>
                    <span className="text-[11px] text-gray-500">
                      Mevcut: {formatCurrency(selectedCustomer.balance)} Borç
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block">Yeni Toplam Borç:</span>
                    <span className="text-xs font-black text-red-700">
                      {formatCurrency(projectedNewBalance)} Borç
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Large SATIŞI TAMAMLA Button */}
          <button
            type="button"
            disabled={!hasItems || isSubmittingSale}
            onClick={handleCompleteSale}
            className={`w-full py-3 px-4 rounded-2xl font-black text-base flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg active:scale-[0.99] border-2 min-h-[48px] ${
              !hasItems
                ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                : isSubmittingSale
                ? 'bg-zeytin-700 border-zeytin-800 text-white opacity-80 cursor-wait'
                : isCredit && !selectedCustomer
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
                : 'bg-zeytin-700 hover:bg-zeytin-800 active:bg-zeytin-900 border-zeytin-800 text-white'
            }`}
          >
            {isSubmittingSale ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>İşleniyor...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-zeytin-200" />
                <span>SATIŞI TAMAMLA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
