export const paymentLabels = {
  cash: 'Nakit',
  card: 'Kredi Kartı',
  account: 'Cari',
  other: 'Diğer'
};

export function formatCurrency(value) {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(numberValue);
}

export function formatDate(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function normalizeNumber(value) {
  const normalized = Number(String(value).replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : 0;
}
