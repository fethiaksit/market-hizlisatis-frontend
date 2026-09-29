import React, { useEffect, useMemo, useState } from 'react';
import { Printer, Download, Search, Minus, Plus, Trash2 } from 'lucide-react';
import { posService } from '../../api/posService';
import { Product } from '../../types/pos';
import { buildZebraLabels } from '../../utils/zebraLabel';

type LabelSize = '80x40' | '50x30' | '40x30' | '50x40';

const money = (value: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(value || 0));

export const LabelPrintView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [size, setSize] = useState<LabelSize>('80x40');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    posService.getAllProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ürünler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    const list = !q ? products : products.filter((product) =>
      product.name.toLocaleLowerCase('tr-TR').includes(q) || product.barcode.toLocaleLowerCase('tr-TR').includes(q)
    );
    return list.slice(0, 100);
  }, [products, query]);

  const selected = useMemo(
    () => products.filter((product) => (counts[String(product.id)] || 0) > 0),
    [products, counts]
  );

  const setCount = (id: string | number, value: number) => {
    const count = Math.max(0, Math.min(99, Number(value) || 0));
    setCounts((current) => ({ ...current, [String(id)]: count }));
  };

  const print = () => {
    if (!selected.length) {
      window.alert('Yazdırmak için en az bir ürün seçin.');
      return;
    }
    window.print();
  };

  const downloadZpl = () => {
    if (!selected.length) {
      window.alert('Yazdırmak için en az bir ürün seçin.');
      return;
    }
    try {
      const zpl = buildZebraLabels(selected.map((product) => ({ product, count: counts[String(product.id)] })));
      const url = URL.createObjectURL(new Blob([zpl], { type: 'application/octet-stream' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'zebra-80x40-etiket.zpl';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ZPL etiketi oluşturulamadı.');
    }
  };

  const dimensions: Record<LabelSize, string> = {
    '80x40': 'w-[80mm] h-[40mm]',
    '50x30': 'w-[50mm] h-[30mm]',
    '40x30': 'w-[40mm] h-[30mm]',
    '50x40': 'w-[50mm] h-[40mm]',
  };

  return (
    <div className="min-h-full p-3 sm:p-5 lg:p-6">
      <style>{`
        @media print {
          @page { size: ${size.replace('x', 'mm ')}mm; margin: 0; }
          body * { visibility: hidden !important; }
          #zebra-label-sheet, #zebra-label-sheet * { visibility: visible !important; }
          #zebra-label-sheet { position: absolute; left: 0; top: 0; display: block !important; }
          .zebra-label { border: 0 !important; break-inside: avoid; page-break-inside: avoid; break-after: page; }
        }
      `}</style>

      <section className="print:hidden bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-gray-900">Zebra Etiket Yazdır</h1>
            <p className="text-sm text-gray-500 mt-1">Ürün adı veya barkodla ara, adet seç ve fiyat etiketlerini yazdır.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={print} className="min-h-[44px] px-4 py-2.5 rounded-xl border border-zeytin-700 text-zeytin-700 font-bold flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" /> Tarayıcıdan Yazdır
            </button>
            <button onClick={downloadZpl} disabled={size !== '80x40'} title={size !== '80x40' ? 'ZPL şablonu yalnızca 80 × 40 mm içindir.' : undefined} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zeytin-700 hover:bg-zeytin-800 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> {selected.length ? `${selected.length} ürün için ZPL indir` : 'ZD220 ZPL İndir'}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-3">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün adı veya barkod ara..." className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-zeytin-500" autoFocus />
          </label>
          <select value={size} onChange={(e) => setSize(e.target.value as LabelSize)} className="min-h-[44px] px-3 rounded-xl border border-gray-300 bg-white font-semibold">
            <option value="80x40">80 × 40 mm (ZD220)</option>
            <option value="50x30">50 × 30 mm</option>
            <option value="40x30">40 × 30 mm</option>
            <option value="50x40">50 × 40 mm</option>
          </select>
          <button onClick={() => setCounts({})} className="min-h-[44px] px-4 rounded-xl border border-gray-300 text-gray-700 font-bold flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Seçimi Temizle
          </button>
        </div>
        <p className="px-4 sm:px-5 pb-3 text-xs text-gray-500">ZD220 için ZPL dosyasını yazıcıya ham ZPL gönderebilen Zebra aracıyla açın. Tarayıcı çıktısı yalnızca metin önizlemesidir; barkod basımı için ZPL kullanın.</p>

        {error && <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-semibold">{error}</div>}
        {loading ? <div className="p-8 text-center text-gray-500">Ürünler yükleniyor...</div> : (
          <div className="overflow-x-auto border-t border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr><th className="text-left p-3">Ürün</th><th className="text-left p-3">Barkod</th><th className="text-right p-3">Fiyat</th><th className="text-center p-3">Etiket Adedi</th></tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const count = counts[String(product.id)] || 0;
                  return (
                    <tr key={product.id} className="border-t border-gray-100">
                      <td className="p-3 font-bold text-gray-900">{product.name}</td>
                      <td className="p-3 font-mono text-gray-600">{product.barcode || '—'}</td>
                      <td className="p-3 text-right font-black">{money(product.price)}</td>
                      <td className="p-3">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => setCount(product.id, count - 1)} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                          <input type="number" min="0" max="99" value={count} onChange={(e) => setCount(product.id, Number(e.target.value))} className="w-14 h-9 rounded-lg border border-gray-300 text-center font-bold" />
                          <button onClick={() => setCount(product.id, count + 1)} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Ürün bulunamadı.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="zebra-label-sheet" className="hidden print:block">
        {selected.flatMap((product) =>
          Array.from({ length: counts[String(product.id)] || 0 }, (_, index) => (
            <article key={`${product.id}-${index}`} className={`zebra-label bg-white text-black border border-dashed border-gray-300 p-[3mm] flex flex-col items-center justify-center overflow-hidden ${dimensions[size]}`}>
              <div className="w-full text-center text-[10pt] leading-tight font-black line-clamp-2">{product.name}</div>
              <div className="text-[19pt] leading-none font-black my-[2mm]">{money(product.price)}</div>
              <div className="font-mono text-[7pt] leading-none">{product.barcode || 'BARKOD YOK'}</div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
