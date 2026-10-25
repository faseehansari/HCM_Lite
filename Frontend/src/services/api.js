import axios from 'axios';
import { toast } from './toast';

// Always read from env; fallback only when the variable is not defined.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const getToken = () => localStorage.getItem('token');
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
};

// ---- Request: attach JWT -------------------------------------------------
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Response: global success / error toasts ---------------------------------
// Pass `{ silent: true }` in the axios config to suppress automatic toasts.
api.interceptors.response.use(
  (response) => {
    const { config, data } = response;
    const isMutation = config.method && config.method.toLowerCase() !== 'get';
    if (isMutation && !config.silent && typeof data?.message === 'string') {
      toast.success(data.message);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const config = error.config || {};
    if (status === 401 && !config.url?.includes('/auth/login')) {
      clearSession();
      if (!window.location.pathname.startsWith('/login')) {
        toast.error('Your session has expired. Please sign in again.');
        window.location.assign('/login');
      }
    } else if (!config.silent) {
      toast.error(getErrorMessage(error));
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  const d = error.response?.data;
  if (d) {
    if (typeof d === 'string') return d;
    if (d.message) return d.message;
    if (d.error) return typeof d.error === 'string' ? d.error : d.error.message || fallback;
    if (Array.isArray(d.errors)) return d.errors.map((e) => e.msg || e.message || e).join(', ');
  }
  // WebAuthn browser errors (NotAllowedError, etc.) and generic errors
  if (error.name === 'NotAllowedError') return 'Biometric prompt was cancelled or timed out.';
  return error.message || fallback;
}

// Backends wrap lists differently ({data:[]}, {employees:[]}, plain []). Normalize.
export function unwrapList(res, ...keys) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  for (const k of [...keys, 'data', 'items', 'results', 'records']) {
    if (Array.isArray(d?.[k])) return d[k];
    if (Array.isArray(d?.data?.[k])) return d.data[k];
  }
  return [];
}

export function unwrapObject(res, ...keys) {
  const d = res?.data;
  for (const k of keys) if (d?.[k] && typeof d[k] === 'object') return d[k];
  return d?.data && typeof d.data === 'object' && !Array.isArray(d.data) ? d.data : d;
}

export default api;
