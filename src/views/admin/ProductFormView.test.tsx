// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AuthProvider } from '../../context/AuthContext';
import { ProductFormView } from './ProductFormView';

describe('ProductFormView fiyat girişi', () => {
  beforeEach(() => {
    localStorage.setItem('zeytin_pos_token', 'test-token');
    localStorage.setItem(
      'zeytin_pos_active_cashier',
      JSON.stringify({ id: '1', name: 'Admin', username: 'admin', role: 'admin' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('Türkçe virgüllü satış ve alış fiyatlarını yazmaya izin verir', async () => {
    render(
      <AuthProvider>
        <ProductFormView productId={null} onClose={() => undefined} />
      </AuthProvider>,
    );

    await screen.findByText('Yeni Ürün Ekle');
    const [salePrice, purchasePrice] = screen.getAllByPlaceholderText('0.00');

    fireEvent.change(salePrice, { target: { value: '12,50' } });
    fireEvent.change(purchasePrice, { target: { value: '8,25' } });

    expect(salePrice).toHaveValue('12,50');
    expect(purchasePrice).toHaveValue('8,25');
  });
  it('başarısız önizlemeden sonra yeni adresi görünür gösterir', async () => {
    render(<AuthProvider><ProductFormView productId={null} onClose={() => undefined} /></AuthProvider>);
    await screen.findByText('Yeni Ürün Ekle');
    const input = screen.getByPlaceholderText('https://... veya server görsel yolu');
    fireEvent.change(input, { target: { value: 'https://example.com/broken.jpg' } });
    fireEvent.error(screen.getByAltText('Önizleme'));
    expect(screen.getByText(/Önizleme yüklenemedi/)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'https://example.com/valid.jpg' } });
    fireEvent.load(screen.getByAltText('Önizleme'));
    expect(screen.getByAltText('Önizleme')).toBeVisible();
    expect(screen.queryByText(/Önizleme yüklenemedi/)).not.toBeInTheDocument();
  });

});
