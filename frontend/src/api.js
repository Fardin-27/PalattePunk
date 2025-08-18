// src/api.js
import axios from 'axios';
import { decodeToken } from './utils/auth';

const api = axios.create({ baseURL: 'http://localhost:5000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🔔 Auto-logout on ban
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || '';
    if (status === 403 && /banned/i.test(msg)) {
      localStorage.removeItem('token');
      window.location.href = '/login?banned=1';
    }
    return Promise.reject(err);
  }
);

export default api;
