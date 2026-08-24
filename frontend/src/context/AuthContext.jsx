import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('keep_token');

    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((response) => setUser(response.data.data.user))
      .catch(() => localStorage.removeItem('keep_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('keep_token', response.data.data.token);
    setUser(response.data.data.user);
  }

  async function register(details) {
    const response = await api.post('/auth/register', details);
    localStorage.setItem('keep_token', response.data.data.token);
    setUser(response.data.data.user);
  }

  function logout() {
    localStorage.removeItem('keep_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
