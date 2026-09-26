// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { posService } from './posService';

describe('posService ürün fiyatları', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('yeni ürün fiyatlarını ZeytinERP alan adlarıyla gönderir', async () => {
    localStorage.setItem('zeytin_pos_token', 'test-token');
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 42,
            name: 'Canga',
            barcode: '8690000000042',
            category: 'Atıştırmalık',
            brand: '',
            description: '',
            image_url: '',
            is_bestseller: false,
            bestseller_order: 0,
            purchase_price: '8.25',
            sale_price: '12.50',
            critical_stock: '0',
            stock: '0',
            is_active: true,
            created_at: '2026-09-24T09:00:00Z',
            updated_at: '2026-09-24T09:00:00Z',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const created = await posService.createProduct(
      {
        barcode: '8690000000042',
        name: 'Canga',
        price: 12.5,
        purchasePrice: 8.25,
        category: 'Atıştırmalık',
      },
      'Admin',
      'admin',
    );

    const [, request] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      sale_price: 12.5,
      purchase_price: 8.25,
      critical_stock: 0,
      is_active: true,
    });
    expect(created.price).toBe(12.5);
    expect(created.purchasePrice).toBe(8.25);
  });

  it('ürün düzenleme fiyatlarını ZeytinERP alan adlarıyla gönderir', async () => {
    localStorage.setItem('zeytin_pos_token', 'test-token');
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 42,
            name: 'Canga',
            barcode: '8690000000042',
            category: 'Atıştırmalık',
            brand: '',
            description: '',
            image_url: '',
            is_bestseller: false,
            bestseller_order: 0,
            purchase_price: '9.25',
            sale_price: '13.50',
            critical_stock: '0',
            stock: '0',
            is_active: true,
            created_at: '2026-09-24T09:00:00Z',
            updated_at: '2026-09-24T09:30:00Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    await posService.updateProduct(
      42,
      {
        barcode: '8690000000042',
        name: 'Canga',
        price: 13.5,
        purchasePrice: 9.25,
        category: 'Atıştırmalık',
      },
      'Admin',
      'admin',
    );

    const [, request] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      sale_price: 13.5,
      purchase_price: 9.25,
      critical_stock: 0,
      is_active: true,
    });
  });
});
