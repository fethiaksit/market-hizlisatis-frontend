import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8082/api',
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = 'Beklenmeyen bir hata oluştu.') {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback
  );
}

export function unwrapArray(payload, keys = ['data', 'items', 'products', 'sales']) {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
}

export default api;
