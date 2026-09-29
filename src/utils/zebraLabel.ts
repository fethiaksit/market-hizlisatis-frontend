type LabelProduct = { name: string; barcode: string; price: number };

const safeName = (value: string) => value
  .toLocaleUpperCase('tr-TR')
  .replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G')
  .replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
  .replace(/[^A-Z0-9 .,/()\-]/g, ' ')
  .replace(/\s+/g, ' ').trim().slice(0, 58);

export function buildZebraLabels(items: Array<{ product: LabelProduct; count: number }>): string {
  return items.flatMap(({ product, count }) => {
    const copies = Math.max(0, Math.min(99, Math.floor(Number(count) || 0)));
    if (!copies) return [];
    const barcode = String(product.barcode || '').trim();
    if (!/^[A-Za-z0-9-]{1,16}$/.test(barcode)) {
      throw new Error(`${product.name}: geçerli bir barkod gerekli (en çok 16 harf/rakam).`);
    }
    if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
      throw new Error(`${product.name}: geçerli bir fiyat gerekli.`);
    }
    const price = `${Number(product.price).toFixed(2).replace('.', ',')} TL`;
    const label = [
      '^XA',
      '^PW640',
      '^LL320',
      '^LH0,0',
      '^FO20,25',
      '^A0N,30,28',
      '^FB600,2,4,C,0',
      `^FD${safeName(product.name)}^FS`,
      '^FO20,108',
      '^A0N,68,60',
      '^FB600,1,0,C,0',
      `^FD${price}^FS`,
      '^BY2,2,48',
      '^FO140,205',
      '^BCN,48,Y,N,N',
      `^FD${barcode}^FS`,
      '^XZ',
    ].join('\n');
    return Array.from({ length: copies }, () => label);
  }).join('\n');
}
