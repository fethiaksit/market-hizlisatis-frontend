export type GlobalWarningDetail = {
  message: string;
  title?: string;
  details?: string;
};

export const GLOBAL_WARNING_EVENT = 'zeytin:warning';

export function showGlobalWarning(message: string, title = 'Uyarı', details?: string) {
  const clean = sanitizeErrorMessage(message);
  window.dispatchEvent(
    new CustomEvent<GlobalWarningDetail>(GLOBAL_WARNING_EVENT, {
      detail: { message: clean, title, details },
    }),
  );
  warningBus.emit({ title, message: clean, details });
}

export interface WarningEvent {
  title: string;
  message: string;
  details?: string;
}

type WarningListener = (event: WarningEvent) => void;

class WarningBus {
  private listeners: WarningListener[] = [];

  subscribe(listener: WarningListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: WarningEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  showWarning(message: string, title = 'Uyarı', details?: string) {
    showGlobalWarning(message, title, details);
  }
}

export const warningBus = new WarningBus();

export function sanitizeErrorMessage(rawMessage: string): string {
  if (!rawMessage) return 'İşlem sırasında beklenmeyen bir hata oluştu.';
  const lower = rawMessage.toLowerCase();
  if (lower.includes('sqlstate') || lower.includes('gorm') || lower.includes('postgres') || lower.includes('database')) {
    return 'Veritabanı işlemi gerçekleştirilemedi. Lütfen bilgilerinizi kontrol edin.';
  }
  if (lower.includes('invalid json body') || lower.includes('unexpected end of json') || lower.includes('syntaxerror')) {
    return 'Gönderilen veri biçimi geçersiz.';
  }
  if (lower.includes('panic') || lower.includes('stack trace') || lower.includes('runtime error')) {
    return 'Sunucuda bir hata meydana geldi.';
  }
  if (lower.includes('forbidden') || lower.includes('403') || lower.includes('yönetici yetkisi')) {
    return 'Bu işlem için yetkiniz bulunmuyor.';
  }
  if (lower.includes('unauthorized') || lower.includes('401')) {
    return 'Oturum süreniz doldu. Lütfen yeniden giriş yapın.';
  }
  if (lower.includes('fetch failed') || lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
  }
  if (lower.includes('credit_limit cannot be negative') || lower.includes('negatif')) {
    return 'Cari limit negatif bir değer olamaz.';
  }
  if (lower.includes('amount must be greater than 0') || lower.includes('tutar sıfırdan büyük')) {
    return 'İşlem tutarı sıfırdan büyük olmalıdır.';
  }
  if (lower.includes('bu telefon numarasıyla kayıtlı')) {
    return 'Bu telefon numarasıyla kayıtlı bir cari müşteri zaten bulunuyor.';
  }
  return rawMessage;
}
