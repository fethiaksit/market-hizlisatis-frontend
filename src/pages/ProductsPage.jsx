import { useEffect, useMemo, useRef, useState } from 'react';
import ProductModal from '../components/ProductModal.jsx';
import api, { getErrorMessage, unwrapArray } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      [product.name, product.barcode, product.category, product.brand]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [products, search]);

  useEffect(() => {
    fetchProducts();
  }, []);

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
      showNotice('error', getErrorMessage(err, 'Ürün listesi alınamadı.'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalProduct(null);
  };

  const saveProduct = async (payload) => {
    setSaving(true);

    try {
      if (modalProduct?.id) {
        await api.put(`/products/${modalProduct.id}`, payload);
        showNotice('success', 'Ürün güncellendi.');
      } else {
        await api.post('/products', payload);
        showNotice('success', 'Ürün eklendi.');
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      showNotice('error', getErrorMessage(err, 'Ürün kaydedilemedi.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(`${product.name} silinsin mi?`);
    if (!confirmed) return;

    try {
      await api.delete(`/products/${product.id}`);
      showNotice('success', 'Ürün silindi.');
      fetchProducts();
    } catch (err) {
      showNotice('error', getErrorMessage(err, 'Ürün silinemedi.'));
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Stok ve Fiyat</span>
          <h2>Ürünler</h2>
        </div>
        <button className="primary-button" onClick={openCreateModal}>
          Ürün Ekle
        </button>
      </div>

      {notice && <div className={`alert ${notice.type}`}>{notice.message}</div>}

      <section className="toolbar-card">
        <label className="search-box light">
          Ürün Ara
          <input
            value={search}
            placeholder="Ürün adı, barkod, kategori veya marka"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      <section className="data-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Barkod</th>
                <th>Kategori</th>
                <th>Marka</th>
                <th>Fiyat</th>
                <th>Stok</th>
                <th>Çok Satan</th>
                <th>Sıra</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="table-product">
                      {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span />}
                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.description || '-'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.barcode}</td>
                  <td>{product.category || '-'}</td>
                  <td>{product.brand || '-'}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td className={Number(product.stock) <= 0 ? 'danger-text' : ''}>{product.stock ?? 0}</td>
                  <td>{product.is_bestseller ? 'Evet' : 'Hayır'}</td>
                  <td>{product.bestseller_order ?? 0}</td>
                  <td>
                    <div className="row-actions">
                      <button className="ghost-button" onClick={() => openEditModal(product)}>
                        Düzenle
                      </button>
                      <button className="danger-button" onClick={() => deleteProduct(product)}>
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredProducts.length === 0 && (
          <div className="empty-state">
            <strong>Ürün yok</strong>
            <span>Yeni ürün ekleyerek başlayın.</span>
          </div>
        )}
      </section>

      {modalOpen && (
        <ProductModal product={modalProduct} saving={saving} onClose={closeModal} onSave={saveProduct} />
      )}
    </div>
  );
}
