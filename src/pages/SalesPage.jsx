import { useEffect, useMemo, useRef, useState } from 'react';
import api, { getErrorMessage, unwrapArray } from '../services/api.js';
import { formatCurrency, formatDate, paymentLabels } from '../utils/format.js';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const visibleDetail = useMemo(() => selectedSale || sales[0] || null, [selectedSale, sales]);

  useEffect(() => {
    fetchSales();
  }, []);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2800);
  };

  const fetchSales = async () => {
    setLoading(true);

    try {
      const response = await api.get('/sales');
      const list = unwrapArray(response.data, ['sales', 'data', 'items']);
      setSales(list);
      setSelectedSale(list[0] || null);
    } catch (err) {
      showNotice('error', getErrorMessage(err, 'Satışlar alınamadı.'));
    } finally {
      setLoading(false);
    }
  };

  const showSaleDetail = async (sale) => {
    setSelectedSale(sale);

    try {
      const response = await api.get(`/sales/${sale.id}`);
      setSelectedSale(response.data?.sale || response.data?.data || response.data);
    } catch {
      setSelectedSale(sale);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Geçmiş İşlemler</span>
          <h2>Satışlar</h2>
        </div>
        <button className="ghost-button" onClick={fetchSales}>
          Yenile
        </button>
      </div>

      {notice && <div className={`alert ${notice.type}`}>{notice.message}</div>}

      <div className="split-grid">
        <section className="data-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Satış No</th>
                  <th>Tarih</th>
                  <th>Ödeme</th>
                  <th>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    className={visibleDetail?.id === sale.id ? 'selected-row' : ''}
                    key={sale.id}
                    onClick={() => showSaleDetail(sale)}
                  >
                    <td>#{sale.id}</td>
                    <td>{formatDate(sale.created_at || sale.date)}</td>
                    <td>{paymentLabels[sale.payment_method] || sale.payment_method || '-'}</td>
                    <td>{formatCurrency(sale.total ?? sale.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && sales.length === 0 && (
            <div className="empty-state">
              <strong>Satış kaydı yok</strong>
              <span>Satış tamamlandığında burada görünür.</span>
            </div>
          )}
        </section>

        <section className="detail-card">
          <div className="panel-title-row">
            <div>
              <span className="eyebrow">Satış Detayı</span>
              <h2>{visibleDetail ? `#${visibleDetail.id}` : 'Seçim Yok'}</h2>
            </div>
            {visibleDetail && <strong>{formatCurrency(visibleDetail.total ?? visibleDetail.total_amount)}</strong>}
          </div>

          {visibleDetail ? (
            <>
              <div className="detail-meta">
                <div>
                  <span>Tarih</span>
                  <strong>{formatDate(visibleDetail.created_at || visibleDetail.date)}</strong>
                </div>
                <div>
                  <span>Ödeme</span>
                  <strong>{paymentLabels[visibleDetail.payment_method] || visibleDetail.payment_method || '-'}</strong>
                </div>
              </div>

              <div className="detail-items">
                {(visibleDetail.items || visibleDetail.sale_items || []).map((item, index) => (
                  <div className="detail-item" key={item.id || index}>
                    <div>
                      <strong>{item.product?.name || item.product_name || item.name || `Ürün #${item.product_id}`}</strong>
                      <span>{item.quantity} adet</span>
                    </div>
                    <b>{formatCurrency(item.total || Number(item.price || 0) * Number(item.quantity || 0))}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <strong>Detay bulunamadı</strong>
              <span>Listeden bir satış seçin.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
