import { useRef, useState } from 'react';
import { formatCurrency } from '../utils/format.js';

export default function Cart({
  cart,
  disabled,
  onBarcodeSubmit,
  onDecrease,
  onIncrease,
  onRemove
}) {
  const [barcode, setBarcode] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
  const inputRef = useRef(null);

  const submitBarcode = async () => {
    const value = barcode.trim();

    if (!value) return;

    setBarcodeError('');
    const result = await onBarcodeSubmit(value);

    if (result?.ok) {
      setBarcode('');
    } else {
      setBarcodeError(result?.message || 'Barkod ile ürün bulunamadı.');
    }

    inputRef.current?.focus();
  };

  const handleBarcodeKeyDown = (event) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    submitBarcode();
  };

  return (
    <section className="cart-panel horizontal-cart-panel">
      <div className="cart-main-area">
        <div className="cart-table-card">
          <div className="cart-table-wrap">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Barkod</th>
                  <th>Adet</th>
                  <th>Birim Fiyat</th>
                  <th>Toplam</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                <tr className="barcode-input-row">
                  <td colSpan="6">
                    <input
                      ref={inputRef}
                      className="cart-barcode-input"
                      value={barcode}
                      disabled={disabled}
                      placeholder="Barkod okut veya gir"
                      onKeyDown={handleBarcodeKeyDown}
                      onChange={(event) => setBarcode(event.target.value)}
                    />
                    {barcodeError && <span className="cart-barcode-error">{barcodeError}</span>}
                  </td>
                </tr>

                {cart.map((item) => {
                  const stockLimitReached =
                    Number(item.stock) > 0 && Number(item.quantity) >= Number(item.stock);
                  const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="cart-product-name">
                          <strong>{item.name}</strong>
                          {stockLimitReached && (
                            <small className="stock-warning">Stok sınırına ulaşıldı</small>
                          )}
                        </div>
                      </td>
                      <td>{item.barcode || '-'}</td>
                      <td>
                        <strong className="cart-quantity-value">{item.quantity}</strong>
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>
                        <strong>{formatCurrency(lineTotal)}</strong>
                      </td>
                      <td>
                        <div className="cart-row-actions">
                          <button
                            className="quantity-action increase-action"
                            aria-label="Adet artır"
                            onClick={() => onIncrease(item)}
                            disabled={stockLimitReached}
                          >
                            +
                          </button>
                          <button className="quantity-action decrease-action" aria-label="Adet azalt" onClick={() => onDecrease(item.id)}>
                            -
                          </button>
                          <button className="danger-button cart-delete-button" onClick={() => onRemove(item.id)}>
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {cart.length === 0 && (
            <div className="empty-state">
              <strong>Sepet boş</strong>
              <span>Barkod okutun, ürün arayın veya çok satanlardan ekleyin.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
