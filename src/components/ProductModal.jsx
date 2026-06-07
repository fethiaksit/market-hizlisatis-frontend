import { useEffect, useState } from 'react';
import { normalizeNumber } from '../utils/format.js';

const emptyForm = {
  name: '',
  barcode: '',
  price: '',
  stock: '',
  category: '',
  brand: '',
  description: '',
  image_url: '',
  is_bestseller: false,
  bestseller_order: ''
};

export default function ProductModal({ product, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        barcode: product.barcode || '',
        price: product.price ?? '',
        stock: product.stock ?? '',
        category: product.category || '',
        brand: product.brand || '',
        description: product.description || '',
        image_url: product.image_url || '',
        is_bestseller: Boolean(product.is_bestseller),
        bestseller_order: product.bestseller_order ?? ''
      });
    } else {
      setForm(emptyForm);
    }
  }, [product]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave({
      ...form,
      price: normalizeNumber(form.price),
      stock: normalizeNumber(form.stock),
      bestseller_order: Math.trunc(normalizeNumber(form.bestseller_order))
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal-card" onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Ürün Kartı</span>
            <h2>{product ? 'Ürün Düzenle' : 'Ürün Ekle'}</h2>
          </div>
          <button className="ghost-button icon-button" type="button" onClick={onClose}>
            X
          </button>
        </div>

        <div className="form-grid">
          <label>
            Ürün Adı
            <input name="name" required value={form.name} onChange={handleChange} />
          </label>
          <label>
            Barkod
            <input name="barcode" required value={form.barcode} onChange={handleChange} />
          </label>
          <label>
            Fiyat
            <input name="price" inputMode="decimal" required value={form.price} onChange={handleChange} />
          </label>
          <label>
            Stok
            <input name="stock" inputMode="numeric" required value={form.stock} onChange={handleChange} />
          </label>
          <label>
            Kategori
            <input name="category" value={form.category} onChange={handleChange} />
          </label>
          <label>
            Marka
            <input name="brand" value={form.brand} onChange={handleChange} />
          </label>
          <label className="checkbox-field">
            <input
              checked={form.is_bestseller}
              name="is_bestseller"
              type="checkbox"
              onChange={handleChange}
            />
            Çok Satanlarda Göster
          </label>
          <label>
            Çok Satan Sırası
            <input
              name="bestseller_order"
              inputMode="numeric"
              value={form.bestseller_order}
              onChange={handleChange}
            />
          </label>
          <label className="full-field">
            Görsel URL
            <input name="image_url" value={form.image_url} onChange={handleChange} />
          </label>
          <label className="full-field">
            Açıklama
            <textarea name="description" rows="3" value={form.description} onChange={handleChange} />
          </label>
        </div>

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Vazgeç
          </button>
          <button className="primary-button" disabled={saving} type="submit">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
