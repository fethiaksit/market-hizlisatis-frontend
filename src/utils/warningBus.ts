export type GlobalWarningDetail = {
  message: string;
  title?: string;
};

export const GLOBAL_WARNING_EVENT = 'zeytin:warning';

export function showGlobalWarning(message: string, title = 'Uyarı') {
  const clean = String(message || '').trim() || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
  window.dispatchEvent(
    new CustomEvent<GlobalWarningDetail>(GLOBAL_WARNING_EVENT, {
      detail: { message: clean, title },
    }),
  );
}
