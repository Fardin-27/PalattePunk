// ✅ src/utils/api.js
import axios from 'axios';
import { clearToken, getToken } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// 🔒 Attach JWT token on every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// 🚨 Handle responses globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      const { status, data } = err.response;

      // If banned, clear token & redirect to login with message
      if (status === 403 && data.message?.toLowerCase().includes('banned')) {
        clearToken();
        window.location.href = '/login?banned=1';
      }

      // If token expired or unauthorized
      if (status === 401) {
        clearToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
