import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = safeStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get('/users/me/');
      setUser(res.data);
    } catch {
      setUser(null);
      safeStorage.removeItem('access_token');
      safeStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await API.post('/token/', { username, password });
    safeStorage.setItem('access_token', res.data.access);
    safeStorage.setItem('refresh_token', res.data.refresh);
    await fetchUser();
    return res.data;
  };

  const logout = () => {
    setUser(null);
    safeStorage.removeItem('access_token');
    safeStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
