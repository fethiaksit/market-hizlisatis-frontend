// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AuthProvider } from '../../context/AuthContext';
import { ProductFormView } from './ProductFormView';
import { posService } from '../../api/posService';

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
    vi.restoreAllMocks();
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

  it('yeni favori ürünü oluşturur, görseli sunucuya indirir, sonra favoriye ekler', async () => {
    const sequence: string[] = [];
    vi.spyOn(posService, 'getCategories').mockResolvedValue([]);
    vi.spyOn(posService, 'createProduct').mockImplementation(async () => {
      sequence.push('create');
      return {id: 42, name: 'Canga', barcode: '86942', price: 25, stock: 0, unit: 'Adet', category: '', isActive: true};
    });
    vi.spyOn(posService, 'importProductImage').mockImplementation(async () => {
      sequence.push('image');
      return {id: 42, name: 'Canga', barcode: '86942', price: 25, stock: 0, unit: 'Adet', category: '', isActive: true, imageUrl: '/api/product-images/product-42-0123456789abcdef0123456789abcdef.jpg'};
    });
    vi.spyOn(posService, 'setProductFavorite').mockImplementation(async () => {
      sequence.push('favorite');
      return {id: 42, name: 'Canga', barcode: '86942', price: 25, stock: 0, unit: 'Adet', category: '', isActive: true, isQuickProduct: true};
    });
    const onClose = vi.fn();
    const {container} = render(<AuthProvider><ProductFormView productId={null} onClose={onClose} /></AuthProvider>);
    await screen.findByText('Yeni Ürün Ekle');
    fireEvent.change(screen.getByPlaceholderText('Örn: Ülker Çikolatalı Gofret'), {target: {value: 'Canga'}});
    fireEvent.change(screen.getByPlaceholderText('Örn: 869000100001'), {target: {value: '86942'}});
    fireEvent.change(screen.getAllByPlaceholderText('0.00')[0], {target: {value: '25'}});
    fireEvent.change(screen.getByPlaceholderText('https://ornek.com/urun.jpg'), {target: {value: 'https://example.com/canga.jpg'}});
    fireEvent.click(container.querySelector('input[name="isQuickProduct"]')!);
    fireEvent.click(screen.getByRole('button', {name: 'Ürünü Kaydet'}));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sequence).toEqual(['create', 'image', 'favorite']);
    expect(posService.importProductImage).toHaveBeenCalledWith(42, 'https://example.com/canga.jpg', 'admin');
  });
});
