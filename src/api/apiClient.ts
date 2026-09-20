// Configurable API Client with LocalStorage persistence & Fallback to Mock
const DEFAULT_API_URL = 'http://localhost:8000/api';

export const getApiBaseUrl = (): string => {
  return localStorage.getItem('zeytin_pos_api_url') || DEFAULT_API_URL;
};

export const setApiBaseUrl = (url: string): void => {
  localStorage.setItem('zeytin_pos_api_url', url);
};

export const isMockMode = (): boolean => {
  const mode = localStorage.getItem('zeytin_pos_use_mock');
  return mode === null ? true : mode === 'true';
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
    throw new Error(errorData.message || errorData.detail || `API Hatası: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
