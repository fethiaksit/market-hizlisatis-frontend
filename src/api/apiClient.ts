import { showGlobalWarning } from '../utils/warningBus';

// Production defaults to the same-origin nginx /api proxy.
// Mock mode is opt-in only; production must never silently show demo data.
const DEFAULT_API_URL = '/api';

export const getApiBaseUrl = (): string => DEFAULT_API_URL;

export const setApiBaseUrl = (url: string): void => {
  localStorage.setItem('zeytin_pos_api_url', url);
};

export const isMockMode = (): boolean => false;

export const setMockMode = (enabled: boolean): void => {
  localStorage.setItem('zeytin_pos_use_mock', enabled ? 'true' : 'false');
};

const FALLBACK_WARNING = 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';

function normalizeServerMessage(value: unknown): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const lower = raw.toLocaleLowerCase('tr-TR');

  const knownMappings: Array<[RegExp, string]> = [
    [/phone is required|telefon.*required/i, 'Telefon numarası zorunludur.'],
    [/name is required|isim.*required/i, 'Ad Soyad / Cari Adı zorunludur.'],
    [/invalid json|invalid.*body/i, 'Gönderilen bilgiler geçersiz. Lütfen alanları kontrol edin.'],
    [/credit_limit cannot be negative|credit limit.*negative/i, 'Cari limit sıfırdan küçük olamaz.'],
    [/invalid.*type/i, 'Seçilen işlem türü geçersiz.'],
    [/amount.*required|amount.*positive|cannot be zero/i, 'Tutar sıfırdan büyük olmalıdır.'],
    [/already.*phone|telefon.*zaten|kayıtlı bir cari müşteri zaten/i, 'Bu telefon numarasıyla kayıtlı bir cari müşteri zaten bulunuyor.'],
    [/forbidden|only administrators|permission denied|not authorized/i, 'Bu işlem için yetkiniz bulunmuyor.'],
    [/unauthorized|authorization token|invalid or expired token|token.*expired/i, 'Oturum süreniz dolmuş olabilir. Lütfen yeniden giriş yapın.'],
    [/not found|record not found/i, 'Aradığınız kayıt bulunamadı.'],
    [/duplicate|unique constraint/i, 'Bu bilgilerle daha önce bir kayıt oluşturulmuş.'],
    [/connection refused|network error|failed to fetch|network request failed/i, 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'],
    [/timeout|timed out/i, 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.'],
  ];

  for (const [pattern, message] of knownMappings) {
    if (pattern.test(raw)) return message;
  }

  // Backend already returned a clear Turkish user-facing message.
  const turkishHints = [
    'lütfen', 'bulunamad', 'zorunlu', 'geçersiz', 'başarısız', 'yetki',
    'kayıtlı', 'telefon', 'müşteri', 'ürün', 'işlem', 'oturum', 'şifre',
    'kullanıcı', 'tutar', 'stok', 'ödeme', 'satış', 'cari'
  ];
  if (turkishHints.some(hint => lower.includes(hint))) return raw;

  // Never expose raw English/technical backend text to the cashier.
  return null;
}

export function getTurkishWarning(error: unknown, fallback = FALLBACK_WARNING): string {
  if (error instanceof Error) {
    return normalizeServerMessage(error.message) || fallback;
  }
  return normalizeServerMessage(error) || fallback;
}

function warningForStatus(status: number): string {
  if (status === 400) return 'İşlem tamamlanamadı: zorunlu alanlardan biri eksik, girilen değerlerden biri geçersiz veya aynı bilgiyle kayıt zaten mevcut. Formdaki alanları tek tek kontrol edin.';
  if (status === 401) return 'Oturum süreniz dolmuş olabilir. Lütfen yeniden giriş yapın.';
  if (status === 403) return 'Bu işlem için yetkiniz bulunmuyor.';
  if (status === 404) return 'Aradığınız kayıt bulunamadı.';
  if (status === 409) return 'Bu kayıt mevcut bilgilerle çakışıyor.';
  if (status === 422) return 'Girilen bilgileri kontrol edip tekrar deneyin.';
  if (status === 429) return 'Çok fazla işlem yapıldı. Kısa bir süre sonra tekrar deneyin.';
  if (status >= 500) return 'Sunucu işlemi tamamlayamadı. Lütfen tekrar deneyin.';
  return FALLBACK_WARNING;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = localStorage.getItem('zeytin_pos_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    const message = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
    showGlobalWarning(message);
    throw new Error(message);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const serverMessage =
      normalizeServerMessage(errorData?.error) ||
      normalizeServerMessage(errorData?.message) ||
      normalizeServerMessage(errorData?.detail);

    const message = serverMessage || warningForStatus(response.status);
    showGlobalWarning(message);
    throw new Error(message);
  }

  const json = await response.json().catch(() => null);
  if (json === null) {
    const message = 'Sunucudan geçerli bir yanıt alınamadı. Lütfen tekrar deneyin.';
    showGlobalWarning(message);
    throw new Error(message);
  }

  if (
    json &&
    typeof json === 'object' &&
    'success' in json &&
    'data' in json
  ) {
    return json.data as T;
  }

  return json as T;
}
