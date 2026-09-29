import React, { useEffect, useMemo, useState } from 'react';
import { Printer, Search, Minus, Plus, Trash2 } from 'lucide-react';
import { posService } from '../../api/posService';
import { Product } from '../../types/pos';

type LabelSize = '50x30' | '40x30' | '50x40';

const money = (value: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(value || 0));

const barcodeBars = (value: string) => {
  const text = String(value || '').trim();
  if (!text) return [];
  const modules: number[] = [2, 1, 2, 1, 1, 2];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    for (let bit = 0; bit < 7; bit += 1) modules.push(((code >> bit) & 1) ? 3 : 1, 1);
  }
  modules.push(3, 1, 1, 2, 2, 1);
  return modules;
};

const BarcodeGraphic: React.FC<{ value: string }> = ({ value }) => {
  const modules = barcodeBars(value);
  const total = modules.reduce((sum, width) => sum + width, 0) || 1;
  let cursor = 0;
  return (
    <svg viewBox={`0 0 ${total} 42`} preserveAspectRatio="none" className="w-full h-9" aria-label={`Barkod ${value}`}>
      {modules.map((width, index) => {
        const x = cursor;
        cursor += width;
        return index % 2 === 0 ? <rect key={index} x={x} y="0" width={width} height="42" fill="black" /> : null;
      })}
    </svg>
  );
};

export const LabelPrintView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [size, setSize] = useState<LabelSize>('50x30');
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

  const dimensions: Record<LabelSize, string> = {
    '50x30': 'w-[50mm] h-[30mm]',
    '40x30': 'w-[40mm] h-[30mm]',
    '50x40': 'w-[50mm] h-[40mm]',
  };

  return (
    <div className="min-h-full p-3 sm:p-5 lg:p-6">
      <style>{`
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden !important; }
          #zebra-label-sheet, #zebra-label-sheet * { visibility: visible !important; }
          #zebra-label-sheet { position: absolute; left: 0; top: 0; display: flex !important; flex-wrap: wrap; gap: 0 !important; }
          .zebra-label { border: 0 !important; break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <section className="print:hidden bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-gray-900">Zebra Etiket Yazdır</h1>
            <p className="text-sm text-gray-500 mt-1">Ürün adı veya barkodla ara, adet seç ve fiyat etiketlerini yazdır.</p>
          </div>
          <button onClick={print} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zeytin-700 hover:bg-zeytin-800 text-white font-bold flex items-center justify-center gap-2">
            <Printer className="w-5 h-5" />
            {selected.length ? `${selected.length} ürün yazdır` : 'Etiket Yazdır'}
          </button>
        </div>

        <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-3">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün adı veya barkod ara..." className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-zeytin-500" autoFocus />
          </label>
          <select value={size} onChange={(e) => setSize(e.target.value as LabelSize)} className="min-h-[44px] px-3 rounded-xl border border-gray-300 bg-white font-semibold">
            <option value="50x30">50 × 30 mm</option>
            <option value="40x30">40 × 30 mm</option>
            <option value="50x40">50 × 40 mm</option>
          </select>
          <button onClick={() => setCounts({})} className="min-h-[44px] px-4 rounded-xl border border-gray-300 text-gray-700 font-bold flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Seçimi Temizle
          </button>
        </div>

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

      <section id="zebra-label-sheet" className="hidden print:flex flex-wrap">
        {selected.flatMap((product) =>
          Array.from({ length: counts[String(product.id)] || 0 }, (_, index) => (
            <article key={`${product.id}-${index}`} className={`zebra-label bg-white text-black border border-dashed border-gray-300 p-[2mm] flex flex-col items-center justify-center overflow-hidden ${dimensions[size]}`}>
              <div className="w-full text-center text-[10pt] leading-tight font-black truncate">{product.name}</div>
              <div className="text-[19pt] leading-none font-black my-[1mm]">{money(product.price)}</div>
              {product.barcode ? <><BarcodeGraphic value={product.barcode} /><div className="font-mono text-[7pt] leading-none mt-[0.5mm]">{product.barcode}</div></> : <div className="text-[8pt] font-bold">BARKOD YOK</div>}
            </article>
          ))
        )}
      </section>
    </div>
  );
};
