import { describe, expect, it } from 'vitest';
import { buildZebraLabels } from './zebraLabel';

describe('Zebra ZD220 labels', () => {
  it('builds one 80 × 40 mm 203 dpi label per requested copy with safe layout', () => {
    const zpl = buildZebraLabels([{ product: { name: 'PETITO MINI 32G X 16 X 9', barcode: '8691234567890', price: 42.5 }, count: 2 }]);
    expect(zpl.match(/\^XA/g)).toHaveLength(2);
    expect(zpl).toContain('^PW640\n^LL320');
    expect(zpl).toContain('^FDPETITO MINI 32G X 16 X 9^FS');
    expect(zpl).toContain('^FD42,50 TL^FS');
    expect(zpl).toContain('^BCN,48,Y,N,N\n^FD8691234567890^FS');
    expect(zpl).toContain('^FO140,205');
  });

  it('rejects missing or unsupported barcodes instead of printing an unscannable symbol', () => {
    expect(() => buildZebraLabels([{ product: { name: 'Ürün', barcode: '', price: 10 }, count: 1 }])).toThrow('barkod');
    expect(() => buildZebraLabels([{ product: { name: 'Ürün', barcode: '123^45', price: 10 }, count: 1 }])).toThrow('barkod');
  });

  it('removes ZPL commands from names and skips zero copies', () => {
    const zpl = buildZebraLabels([
      { product: { name: 'ÇİLEK ^XA ~DG', barcode: '12345678', price: 9 }, count: 1 },
      { product: { name: 'Su', barcode: '12345678', price: 10 }, count: 0 },
    ]);
    expect(zpl.match(/\^XA/g)).toHaveLength(1);
    expect(zpl).toContain('^FDCILEK XA DG^FS');
  });
});
