'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/api';

const AuthContext = createContext(null);

const DEMO_USER = {
  id:    'demo',
  name:  'Usuario Demo',
  email: 'demo@notara.com',
};
const DEMO_PASSWORD = 'demo1234';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token  = localStorage.getItem('access_token');

    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    if (email === DEMO_USER.email && password === DEMO_PASSWORD) {
      localStorage.setItem('access_token', 'demo_token');
      localStorage.setItem('user', JSON.stringify(DEMO_USER));
      setUser(DEMO_USER);
      return { user: DEMO_USER };
    }
    const data = await auth.login(email, password);
    // Si el backend no devuelve user en el login, lo pedimos aparte
    const userData = data?.user || await auth.me().catch(() => null);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    return { ...data, user: userData };
  };

  const register = async (name, email, password) => {
    await auth.register(name, email, password);
    return login(email, password);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};