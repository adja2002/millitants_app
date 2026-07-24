import axios from 'axios';

// Safe localStorage wrapper for restricted environments
const safeStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
API.interceptors.request.use(
  (config) => {
    const token = safeStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les tokens expirés
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = safeStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          safeStorage.setItem('access_token', newAccess);
          if (res.data.refresh) {
            safeStorage.setItem('refresh_token', res.data.refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return API(originalRequest);
        } catch (refreshError) {
          safeStorage.removeItem('access_token');
          safeStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        safeStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;
