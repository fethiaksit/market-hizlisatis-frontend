import { useEffect, useMemo, useRef, useState } from 'react';
import Cart from '../components/Cart.jsx';
import api, { getErrorMessage, unwrapArray } from '../services/api.js';
import { formatCurrency, paymentLabels } from '../utils/format.js';

const saleTabs = [
  { id: 'kasa-1', label: 'Kasa 1' },
  { id: 'kasa-2', label: 'Kasa 2' },
  { id: 'kasa-3', label: 'Kasa 3' },
  { id: 'kasa-4', label: 'Kasa 4' },
  { id: 'kasa-5', label: 'Kasa 5' }
];

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [bestsellerPage, setBestsellerPage] = useState(1);
  const [activeSaleId, setActiveSaleId] = useState('kasa-1');
  const [cartBySale, setCartBySale] = useState({ 'kasa-1': [] });
  const [search, setSearch] = useState('');
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const cart = cartBySale[activeSaleId] || [];

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cart]
  );
  const total = subtotal;

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      [product.name, product.barcode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [products, search]);

  const productList = useMemo(() => filteredProducts, [filteredProducts]);
  const bestsellerPageSize = 4;
  const bestsellerPageCount = Math.max(1, Math.ceil(bestsellerProducts.length / bestsellerPageSize));
  const visibleBestsellers = useMemo(
    () =>
      bestsellerProducts.slice(
        (bestsellerPage - 1) * bestsellerPageSize,
        bestsellerPage * bestsellerPageSize
      ),
    [bestsellerPage, bestsellerProducts]
  );

  useEffect(() => {
    fetchProducts();
    fetchBestsellers();
  }, []);

  useEffect(() => {
    if (bestsellerPage > bestsellerPageCount) {
      setBestsellerPage(bestsellerPageCount);
    }
  }, [bestsellerPage, bestsellerPageCount]);

  useEffect(() => {
    if (!productsModalOpen) return;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setProductsModalOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [productsModalOpen]);

  const setActiveCart = (updater) => {
    setCartBySale((current) => {
      const previous = current[activeSaleId] || [];
      const next = typeof updater === 'function' ? updater(previous) : updater;

      return {
        ...current,
        [activeSaleId]: next
      };
    });
  };

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2800);
  };

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const response = await api.get('/products');
      setProducts(unwrapArray(response.data, ['products', 'data', 'items']));
    } catch (err) {
      showNotice('error', getErrorMessage(err, 'Ürünler yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchBestsellers = async () => {
    try {
      const response = await api.get('/products/bestsellers');
      setBestsellerProducts(unwrapArray(response.data, ['products', 'data', 'items']));
      setBestsellerPage(1);
    } catch (err) {
      showNotice('error', getErrorMessage(err, 'Çok satan ürünler yüklenemedi.'));
    }
  };

  const addToCart = (product) => {
    setActiveCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      const stock = Number(product.stock || 0);

      if (existing) {
        if (stock > 0 && existing.quantity >= stock) {
          showNotice('error', `${product.name} için stok sınırı aşılamaz.`);
          return current;
        }

        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      if (stock <= 0) {
        showNotice('error', `${product.name} stokta yok. Backend satış kontrolünü yine yapacaktır.`);
      }

      return [...current, { ...product, quantity: 1 }];
    });
  };

  const handleBarcodeSubmit = async (barcode) => {
    setLoading(true);

    try {
      const response = await api.get(`/products/barcode/${encodeURIComponent(barcode)}`);
      const product = response.data?.product || response.data?.data || response.data;

      if (!product?.id) {
        const message = 'Bu barkoda ait ürün bulunamadı.';
        showNotice('error', message);
        return { ok: false, message };
      }

      addToCart(product);
      showNotice('success', `${product.name} sepete eklendi.`);
      return { ok: true, product };
    } catch (err) {
      const message = getErrorMessage(err, 'Barkod ile ürün bulunamadı.');
      showNotice('error', message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  };

  const decreaseQuantity = (productId) => {
    setActiveCart((current) =>
      current
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const increaseQuantity = (product) => addToCart(product);

  const removeItem = (productId) => {
    setActiveCart((current) => current.filter((item) => item.id !== productId));
  };

  const completeSale = async () => {
    setCheckoutLoading(true);

    const payload = {
      payment_method: paymentMethod,
      subtotal,
      total,
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: Number(item.price || 0),
        total: Number(item.price || 0) * item.quantity
      }))
    };

    try {
      await api.post('/sales', payload);
      setActiveCart([]);
      showNotice('success', 'Satış başarıyla tamamlandı.');
      fetchProducts();
    } catch (err) {
      showNotice('error', getErrorMessage(err, 'Satış tamamlanamadı. Lütfen tekrar deneyin.'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="pos-page">
      <section className="pos-work-area">
        <div className="pos-left-column">
          <section className="pos-command-center">
            <div className="sale-tabs">
              {saleTabs.map((tab) => {
                const itemCount = (cartBySale[tab.id] || []).reduce(
                  (sum, item) => sum + Number(item.quantity || 0),
                  0
                );

                return (
                  <button
                    className={activeSaleId === tab.id ? 'sale-tab active' : 'sale-tab'}
                    key={tab.id}
                    onClick={() => setActiveSaleId(tab.id)}
                    type="button"
                  >
                    <span>{tab.label}</span>
                    <strong>{itemCount}</strong>
                  </button>
                );
              })}
            </div>

            <div className="pos-total-board">
              <span>Genel Toplam</span>
              <strong>{formatCurrency(total)}</strong>
              <small>{cart.length} kalem ürün</small>
            </div>
          </section>

          {notice && <div className={`alert ${notice.type}`}>{notice.message}</div>}

          <section className="products-toggle-section">
            <button
              className="products-toggle-button"
              onClick={() => setProductsModalOpen(true)}
              type="button"
            >
              Ürünleri Göster
            </button>
          </section>

          {productsModalOpen && (
            <div
              className="products-modal-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setProductsModalOpen(false);
                }
              }}
              role="presentation"
            >
              <aside className="product-list-panel products-modal" role="dialog" aria-modal="true">
                <div className="products-modal-header">
                  <div>
                    <span className="eyebrow">Manuel Seçim</span>
                    <h2>Ürünler</h2>
                  </div>
                  <button className="ghost-button" onClick={() => setProductsModalOpen(false)} type="button">
                    Kapat
                  </button>
                </div>

                <label className="search-box product-search-box">
                  Ürün Ara
                  <input
                    autoFocus
                    value={search}
                    placeholder="Ürün adı veya barkod"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>

                <div className="product-list-table">
                  <div className="product-list-header">
                    <span>Ürün Adı</span>
                    <span>Barkod</span>
                    <span>Fiyat</span>
                    <span>Stok</span>
                    <span>Kategori</span>
                    <span>İşlem</span>
                  </div>

                  <div className="product-list-scroll">
                    {productList.map((product) => (
                      <div className="product-list-row" key={product.id} onClick={() => addToCart(product)} role="button" tabIndex="0">
                        <strong>{product.name}</strong>
                        <span>{product.barcode || '-'}</span>
                        <b>{formatCurrency(product.price)}</b>
                        <span className={Number(product.stock) <= 0 ? 'danger-text' : ''}>{product.stock ?? 0}</span>
                        <span>{product.category || '-'}</span>
                        <button
                          className="product-add-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            addToCart(product);
                          }}
                          type="button"
                        >
                          Sepete Ekle
                        </button>
                      </div>
                    ))}
                  </div>

                  {!loading && productList.length === 0 && (
                    <div className="empty-state compact-empty">
                      <strong>Ürün bulunamadı</strong>
                      <span>Arama kriterini değiştirin veya barkod okutun.</span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}

          <section className="pos-register-area">
            <Cart
              cart={cart}
              disabled={loading}
              onBarcodeSubmit={handleBarcodeSubmit}
              onDecrease={decreaseQuantity}
              onIncrease={increaseQuantity}
              onRemove={removeItem}
            />
          </section>
        </div>

        <aside className="bestseller-panel">
          <div className="panel-title-row">
            <div>
              <span className="eyebrow">Hızlı Ekle</span>
              <h2>Çok Satan Ürünler</h2>
            </div>
          </div>

          <div className="bestseller-grid">
            {visibleBestsellers.map((product) => (
              <button className="bestseller-button" key={product.id} onClick={() => addToCart(product)} type="button">
                <strong>{product.name}</strong>
                <span>{product.barcode || 'Barkodsuz'}</span>
                <b>{formatCurrency(product.price)}</b>
              </button>
            ))}
          </div>

          {bestsellerProducts.length > bestsellerPageSize && (
            <div className="bestseller-pagination">
              <button
                disabled={bestsellerPage === 1}
                onClick={() => setBestsellerPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                Önceki
              </button>
              {Array.from({ length: bestsellerPageCount }, (_, index) => index + 1).map((page) => (
                <button
                  className={bestsellerPage === page ? 'active' : ''}
                  key={page}
                  onClick={() => setBestsellerPage(page)}
                  type="button"
                >
                  {page}
                </button>
              ))}
              <button
                disabled={bestsellerPage === bestsellerPageCount}
                onClick={() => setBestsellerPage((current) => Math.min(bestsellerPageCount, current + 1))}
                type="button"
              >
                Sonraki
              </button>
            </div>
          )}

          {bestsellerProducts.length === 0 && (
            <div className="empty-state compact-empty">
              <strong>Çok satan ürün eklenmemiş</strong>
              <span>Ürün düzenleme ekranından ürün seçin.</span>
            </div>
          )}
        </aside>
      </section>

      <div className="checkout-bar">
        <div className="checkout-total">
          <span>Toplam Tutar</span>
          <strong>{formatCurrency(total)}</strong>
          <small>Ara toplam: {formatCurrency(subtotal)}</small>
        </div>

        <div className="checkout-payment">
          {Object.entries(paymentLabels).map(([value, label]) => (
            <button
              className={paymentMethod === value ? 'payment-option active' : 'payment-option'}
              key={value}
              onClick={() => setPaymentMethod(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <button
          className="complete-sale-button"
          disabled={checkoutLoading || cart.length === 0}
          onClick={completeSale}
        >
          Satışı Tamamla
        </button>
      </div>
    </div>
  );
}
