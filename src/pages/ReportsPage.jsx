import { useEffect, useMemo, useRef, useState } from 'react';
import api, { getErrorMessage } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

const emptyReport = {
  daily_revenue: 0,
  cash_total: 0,
  card_total: 0,
  account_total: 0,
  other_total: 0,
  top_products: []
};

export default function ReportsPage() {
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const cards = useMemo(
    () => [
      { label: 'Günlük Ciro', value: report.daily_revenue ?? report.total_revenue },
      { label: 'Nakit Toplam', value: report.cash_total },
      { label: 'Kart Toplam', value: report.card_total },
      { label: 'Cari Toplam', value: report.account_total },
      { label: 'Diğer Toplam', value: report.other_total }
    ],
    [report]
  );

  useEffect(() => {
    fetchReport();
  }, []);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2800);
  };

  const fetchReport = async () => {
    setLoading(true);

    try {
      const response = await api.get('/reports/daily');
      setReport(response.data?.report || response.data?.data || response.data || emptyReport);
    } catch (err) {
      showNotice('error', getErrorMessage(err, 'Rapor verileri alınamadı.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Günlük Özet</span>
          <h2>Raporlar</h2>
        </div>
        <button className="ghost-button" disabled={loading} onClick={fetchReport}>
          Yenile
        </button>
      </div>

      {notice && <div className={`alert ${notice.type}`}>{notice.message}</div>}

      <section className="report-grid">
        {cards.map((card) => (
          <div className="metric-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{formatCurrency(card.value)}</strong>
          </div>
        ))}
      </section>

      <section className="data-card">
        <div className="panel-title-row">
          <div>
            <span className="eyebrow">Performans</span>
            <h2>En Çok Satan Ürünler</h2>
          </div>
        </div>

        <div className="top-products">
          {(report.top_products || report.best_sellers || []).map((product, index) => (
            <div className="top-product-row" key={product.id || product.product_id || index}>
              <span className="rank">{index + 1}</span>
              <div>
                <strong>{product.name || product.product_name}</strong>
                <span>{product.quantity || product.total_quantity || 0} adet</span>
              </div>
              <b>{formatCurrency(product.total || product.revenue)}</b>
            </div>
          ))}
        </div>

        {(report.top_products || report.best_sellers || []).length === 0 && (
          <div className="empty-state">
            <strong>Veri yok</strong>
            <span>Bugünkü satışlar rapora yansıyınca burada görünür.</span>
          </div>
        )}
      </section>
    </div>
  );
}
