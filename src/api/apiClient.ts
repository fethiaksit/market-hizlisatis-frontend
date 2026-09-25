// Production defaults to the same-origin nginx /api proxy.
// Mock mode is opt-in only; production must never silently show demo data.
const DEFAULT_API_URL = '/api';

export const getApiBaseUrl = (): string => {
  return DEFAULT_API_URL;
};

export const setApiBaseUrl = (url: string): void => {
  localStorage.setItem('zeytin_pos_api_url', url);
};

export const isMockMode = (): boolean => {
  return false;
};

export const setMockMode = (enabled: boolean): void => {
  localStorage.setItem('zeytin_pos_use_mock', enabled ? 'true' : 'false');
};

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = localStorage.getItem('zeytin_pos_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error ||
      errorData.message ||
      errorData.detail ||
      `API Hatası: ${response.status} ${response.statusText}`;
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.response = {
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };
    throw error;
  }

  const json = await response.json();

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
